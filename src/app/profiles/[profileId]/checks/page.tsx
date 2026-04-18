import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import CustomChecksClient from "@/components/custom-checks-client";

export default async function ChecksPage({
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
      checks: {
        orderBy: { createdAt: "asc" },
        include: { groups: { select: { groupId: true } } },
      },
      groups: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!profile || profile.userId !== session.user.id) notFound();

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
          <h1 className="text-2xl font-bold text-gray-900">Custom checks</h1>
          <p className="text-gray-500 text-sm mt-1">
            Define your own checks to run alongside the built-in SEO analysis.
            Scope each check to one or more page groups, or leave unscoped to run on all pages.
          </p>
        </div>
      </div>

      <CustomChecksClient
        profileId={profileId}
        initialChecks={profile.checks}
        availableGroups={profile.groups}
      />
    </div>
  );
}
