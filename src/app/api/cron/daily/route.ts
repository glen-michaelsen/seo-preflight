import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAnalysis } from "@/lib/analysis/runner";

/**
 * GET /api/cron/daily
 * Called by Vercel Cron at 06:00 UTC every day.
 * Secured with CRON_SECRET — Vercel passes it as Authorization: Bearer <secret>.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const todayDow = now.getDay();   // 0=Sun … 6=Sat
  const todayDom = now.getDate();  // 1–31
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Find all profiles with an active schedule that is due today
  const profiles = await prisma.profile.findMany({
    where: {
      scheduleType: { not: null },
    },
    include: {
      checks: {
        where: { enabled: true },
        include: { groups: { select: { groupId: true } } },
      },
      groups: {
        include: { pages: { include: { keywords: true } } },
      },
    },
  });

  const due = profiles.filter((p) => {
    if (p.scheduleType === "weekly") {
      return p.scheduleDayOfWeek === todayDow;
    }
    if (p.scheduleType === "monthly") {
      // Clamp: if user chose 31 but this month only has 28 days → run on day 28
      const effective = Math.min(p.scheduleDayOfMonth ?? 1, lastDayOfMonth);
      return effective === todayDom;
    }
    return false;
  });

  const results = await Promise.allSettled(
    due.map(async (profile) => {
      const pages = profile.groups.flatMap((g) =>
        g.pages.map((page) => ({
          id: page.id,
          path: page.path,
          label: page.label,
          groupId: g.id,
          groupName: g.name,
          keywords: page.keywords.map((k) => k.keyword),
        }))
      );

      const customChecks = profile.checks.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        config: c.config,
        groupIds: c.groups.map((g) => g.groupId),
      }));

      const disabledChecks: string[] = profile.disabledChecks
        ? JSON.parse(profile.disabledChecks)
        : [];

      const analysis = await prisma.analysis.create({
        data: { profileId: profile.id, status: "RUNNING" },
      });

      try {
        const analysisResults = await runAnalysis(profile.url, pages, customChecks, disabledChecks);

        await prisma.analysis.update({
          where: { id: analysis.id },
          data: {
            status: "COMPLETE",
            completedAt: new Date(),
            results: JSON.stringify(analysisResults),
          },
        });

        await prisma.profile.update({
          where: { id: profile.id },
          data: { scheduleLastRunAt: new Date() },
        });

        return { profileId: profile.id, status: "ok" };
      } catch (err) {
        await prisma.analysis.update({
          where: { id: analysis.id },
          data: {
            status: "ERROR",
            completedAt: new Date(),
            errorMessage: err instanceof Error ? err.message : "Unknown error",
          },
        });
        return { profileId: profile.id, status: "error" };
      }
    })
  );

  return NextResponse.json({
    ran: due.length,
    results: results.map((r) => (r.status === "fulfilled" ? r.value : { error: r.reason })),
  });
}
