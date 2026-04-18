import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SiteScreenshot from "@/components/site-screenshot";
import type { AnalysisResults } from "@/types/analysis";

interface CardStats {
  fail: number;
  warn: number;
  pass: number;
  total: number;
}

/** Returns the next future date that matches the schedule, or null if no schedule. */
function nextScheduledRun(
  scheduleType: string | null,
  scheduleDayOfWeek: number | null,
  scheduleDayOfMonth: number | null,
): Date | null {
  if (!scheduleType) return null;

  const now = new Date();
  // Normalise to start-of-today (UTC offset doesn't matter much for day-level accuracy)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (scheduleType === "weekly" && scheduleDayOfWeek !== null) {
    const todayDow = today.getDay();
    // Days until next occurrence — never 0 (so we always show a future date)
    const daysUntil = ((scheduleDayOfWeek - todayDow + 7) % 7) || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + daysUntil);
    return next;
  }

  if (scheduleType === "monthly" && scheduleDayOfMonth !== null) {
    // Try this month first
    const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const effectiveThisMonth = Math.min(scheduleDayOfMonth, lastDayThisMonth);
    if (effectiveThisMonth > today.getDate()) {
      return new Date(today.getFullYear(), today.getMonth(), effectiveThisMonth);
    }
    // Otherwise next month
    const nm = today.getMonth() + 1;
    const ny = nm > 11 ? today.getFullYear() + 1 : today.getFullYear();
    const lastDayNextMonth = new Date(ny, (nm % 12) + 1, 0).getDate();
    const effectiveNextMonth = Math.min(scheduleDayOfMonth, lastDayNextMonth);
    return new Date(ny, nm % 12, effectiveNextMonth);
  }

  return null;
}


function computeStats(resultsJson: string | null): CardStats | null {
  if (!resultsJson) return null;
  try {
    const results: AnalysisResults = JSON.parse(resultsJson);
    let fail = 0, warn = 0, pass = 0;
    for (const page of results.pages) {
      for (const c of page.standard) {
        if (c.status === "fail") fail++;
        else if (c.status === "warn") warn++;
        else pass++;
      }
      for (const c of page.custom) {
        if (c.status === "fail" || c.status === "error") fail++;
        else pass++;
      }
    }
    return { fail, warn, pass, total: fail + warn + pass };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      url: true,
      scheduleType: true,
      scheduleDayOfWeek: true,
      scheduleDayOfMonth: true,
      _count: { select: { analyses: true, checks: true } },
      analyses: {
        take: 1,
        orderBy: { startedAt: "desc" },
        where: { status: "COMPLETE" },
        select: { id: true, status: true, startedAt: true, results: true },
      },
    },
  });

  // Fetch screenshot metadata separately (avoids loading blobs in the main query)
  const screenshotRows = await prisma.profile.findMany({
    where: { userId: session.user.id },
    select: { id: true, screenshotData: true, screenshotUpdatedAt: true },
  });
  const screenshotMap = Object.fromEntries(screenshotRows.map((r) => [r.id, r]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Profiles</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and analyse your websites
          </p>
        </div>
        <Link
          href="/profiles/new"
          className="px-4 py-2 bg-gtc-green text-white text-sm font-semibold rounded-lg hover:bg-gtc-green-dark transition-colors"
        >
          + New profile
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 text-lg mb-4">No profiles yet</p>
          <Link
            href="/profiles/new"
            className="px-5 py-2.5 bg-gtc-green text-white font-semibold rounded-lg hover:bg-gtc-green-dark transition-colors"
          >
            Add your first website
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const lastAnalysis = profile.analyses[0] ?? null;
            const stats = lastAnalysis ? computeStats(lastAnalysis.results ?? null) : null;
            const nextRun = nextScheduledRun(
              profile.scheduleType,
              profile.scheduleDayOfWeek,
              profile.scheduleDayOfMonth,
            );

            return (
              <Link
                key={profile.id}
                href={`/profiles/${profile.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gtc-green/40 hover:shadow-md transition-all group flex flex-col"
              >
                {/* Screenshot thumbnail */}
                <div className="relative w-full h-40 overflow-hidden group/card shrink-0">
                  <SiteScreenshot
                    profileId={profile.id}
                    initialData={screenshotMap[profile.id]?.screenshotData ?? null}
                    screenshotUpdatedAt={screenshotMap[profile.id]?.screenshotUpdatedAt?.toISOString() ?? null}
                  />
                  {lastAnalysis && (
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <StatusBadge status={lastAnalysis.status} />
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 flex-1">
                  <h2 className="font-semibold text-gray-900 truncate mb-1">
                    {profile.name}
                  </h2>
                  <p className="text-xs text-gray-400 truncate mb-3">{profile.url}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>{profile._count.analyses} analysis</span>
                    <span>{profile._count.checks} custom check{profile._count.checks !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1.5 space-y-0.5">
                    {lastAnalysis ? (
                      <p>
                        Last run{" "}
                        {new Date(lastAnalysis.startedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    ) : (
                      <p className="text-gray-300">No analysis yet</p>
                    )}
                    {nextRun && (
                      <p className="text-gtc-green/80">
                        Next run{" "}
                        {nextRun.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats bar */}
                {stats ? (
                  <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-3">
                    <StatPill color="red" label="Errors" value={stats.fail} total={stats.total} />
                    <StatPill color="yellow" label="Warnings" value={stats.warn} total={stats.total} />
                    <StatPill color="green" label="Passed" value={stats.pass} total={stats.total} />
                  </div>
                ) : (
                  <div className="border-t border-gray-100 px-4 py-2.5">
                    <p className="text-xs text-gray-300">No analysis yet</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatPill({
  color,
  label,
  value,
  total,
}: {
  color: "red" | "yellow" | "green";
  label: string;
  value: number;
  total: number;
}) {
  const dot: Record<string, string> = {
    red: "bg-red-400",
    yellow: "bg-yellow-400",
    green: "bg-green-400",
  };
  const text: Record<string, string> = {
    red: value > 0 ? "text-red-600 font-semibold" : "text-gray-400",
    yellow: value > 0 ? "text-yellow-600 font-semibold" : "text-gray-400",
    green: "text-green-600 font-semibold",
  };
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot[color]}`} />
      <span className={`text-xs tabular-nums ${text[color]}`}>{value}</span>
      <span className="text-xs text-gray-300 truncate">{pct}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETE: "bg-green-100 text-green-700",
    RUNNING: "bg-blue-100 text-blue-700",
    ERROR: "bg-red-100 text-red-700",
    PENDING: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 backdrop-blur-sm ${map[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status.toLowerCase()}
    </span>
  );
}
