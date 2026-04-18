import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import CustomChecksClient from "@/components/custom-checks-client";
import StandardChecksClient from "@/components/standard-checks-client";

export default async function ChecksPage({
  params,
  searchParams,
}: {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { profileId } = await params;
  const { tab } = await searchParams;
  const activeTab: "custom" | "standard" = tab === "custom" ? "custom" : "standard";

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      checks: {
        orderBy: { createdAt: "asc" },
        include: { groups: { select: { groupId: true } } },
      },
      groups: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!profile || profile.userId !== session.user.id) notFound();

  const disabledChecks: string[] = profile.disabledChecks
    ? JSON.parse(profile.disabledChecks)
    : [];

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/profiles/${profileId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {profile.name}
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-gray-900">Checks</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure which checks run when you analyse this profile.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <Link
          href={`/profiles/${profileId}/checks?tab=standard`}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "standard"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Standard checks
          {disabledChecks.length > 0 && (
            <span className="ml-1.5 text-xs text-red-400">({disabledChecks.length} off)</span>
          )}
        </Link>
        <Link
          href={`/profiles/${profileId}/checks?tab=custom`}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "custom"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Custom checks
          {profile.checks.length > 0 && (
            <span className="ml-1.5 text-xs text-gray-400">({profile.checks.length})</span>
          )}
        </Link>
      </div>

      {activeTab === "custom" && (
        <CustomChecksClient
          profileId={profileId}
          initialChecks={profile.checks}
          availableGroups={profile.groups}
        />
      )}

      {activeTab === "standard" && (
        <StandardChecksClient
          profileId={profileId}
          initialDisabled={disabledChecks}
        />
      )}
    </div>
  );
}
