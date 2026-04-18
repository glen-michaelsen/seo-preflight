import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { analyses: true, checks: true } },
      analyses: {
        take: 1,
        orderBy: { startedAt: "desc" },
        select: { id: true, status: true, startedAt: true },
      },
    },
  });

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
            const lastAnalysis = profile.analyses[0];
            return (
              <Link
                key={profile.id}
                href={`/profiles/${profile.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gtc-green/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 truncate pr-2">
                    {profile.name}
                  </h2>
                  {lastAnalysis && (
                    <StatusBadge status={lastAnalysis.status} />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mb-4">{profile.url}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{profile._count.analyses} analysis</span>
                  <span>{profile._count.checks} custom check{profile._count.checks !== 1 ? "s" : ""}</span>
                </div>
                {lastAnalysis && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last run{" "}
                    {new Date(lastAnalysis.startedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
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
      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${map[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status.toLowerCase()}
    </span>
  );
}
