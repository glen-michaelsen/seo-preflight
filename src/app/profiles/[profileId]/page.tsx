import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import RunAnalysisButton from "@/components/run-analysis-button";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      analyses: {
        orderBy: { startedAt: "desc" },
        take: 20,
        select: { id: true, status: true, startedAt: true, completedAt: true, errorMessage: true },
      },
      _count: { select: { checks: true } },
      groups: {
        include: { _count: { select: { pages: true } } },
      },
    },
  });

  if (!profile || profile.userId !== session.user.id) notFound();

  const totalPages = profile.groups.reduce((s, g) => s + g._count.pages, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <a
              href={profile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              {profile.url}
            </a>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href={`/profiles/${profile.id}/pages`}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Pages ({totalPages})
            </Link>
            <Link
              href={`/profiles/${profile.id}/checks`}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Custom checks ({profile._count.checks})
            </Link>
            <RunAnalysisButton profileId={profile.id} />
          </div>
        </div>
      </div>

      {/* Pages summary */}
      {profile.groups.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-sm font-medium text-gray-700 mb-2">Pages being analysed</p>
          <div className="flex flex-wrap gap-2">
            {profile.groups.map((group) => (
              <span key={group.id} className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600">
                <span className="font-medium">{group.name}</span>
                {" "}
                <span className="text-gray-400">
                  ({group._count.pages} page{group._count.pages !== 1 ? "s" : ""})
                </span>
              </span>
            ))}
          </div>
          {totalPages === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Groups exist but have no pages yet.{" "}
              <Link href={`/profiles/${profile.id}/pages`} className="text-green-600 hover:underline">
                Add pages
              </Link>
            </p>
          )}
        </div>
      )}

      {profile.groups.length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          No pages configured — analysis will check only the root URL.{" "}
          <Link href={`/profiles/${profile.id}/pages`} className="font-medium underline hover:no-underline">
            Add pages and groups
          </Link>
        </div>
      )}

      {/* Analysis history */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis history</h2>

        {profile.analyses.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500 mb-3">No analyses run yet</p>
            <p className="text-sm text-gray-400">
              Click &quot;Run analysis&quot; to check your site&apos;s SEO health.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {profile.analyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <StatusDot status={analysis.status} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(analysis.startedAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {analysis.errorMessage && (
                      <p className="text-xs text-red-500 mt-0.5">{analysis.errorMessage}</p>
                    )}
                  </div>
                </div>
                {analysis.status === "COMPLETE" ? (
                  <Link
                    href={`/profiles/${profile.id}/analyses/${analysis.id}`}
                    className="text-sm font-medium text-green-600 hover:underline"
                  >
                    View results →
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400 capitalize">{analysis.status.toLowerCase()}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETE: "bg-green-500",
    RUNNING: "bg-blue-500 animate-pulse",
    ERROR: "bg-red-500",
    PENDING: "bg-gray-400",
  };
  return (
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[status] ?? "bg-gray-400"}`} />
  );
}
