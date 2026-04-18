import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runAnalysis } from "@/lib/analysis/runner";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const analyses = await prisma.analysis.findMany({
    where: { profileId },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      errorMessage: true,
    },
  });

  return NextResponse.json(analyses);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      checks: {
        where: { enabled: true },
        include: { groups: { select: { groupId: true } } },
      },
      groups: {
        include: {
          pages: { include: { keywords: true } },
        },
      },
    },
  });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Flatten groups → pages for the runner
  const pages = profile.groups.flatMap((group) =>
    group.pages.map((page) => ({
      id: page.id,
      path: page.path,
      label: page.label,
      groupId: group.id,
      groupName: group.name,
      keywords: page.keywords.map((k) => k.keyword),
    }))
  );

  const customChecks = profile.checks.map((check) => ({
    id: check.id,
    name: check.name,
    type: check.type,
    config: check.config,
    groupIds: check.groups.map((g) => g.groupId),
  }));

  const analysis = await prisma.analysis.create({
    data: { profileId, status: "RUNNING" },
  });

  try {
    const results = await runAnalysis(profile.url, pages, customChecks);

    const completed = await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "COMPLETE",
        completedAt: new Date(),
        results: JSON.stringify(results),
      },
    });

    return NextResponse.json(completed, { status: 201 });
  } catch (err) {
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "ERROR",
        completedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: "Analysis failed", analysisId: analysis.id },
      { status: 502 }
    );
  }
}
