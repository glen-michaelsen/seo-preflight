import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import PageGroupsClient from "@/components/page-groups-client";

export default async function PagesPage({
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
      groups: {
        orderBy: { createdAt: "asc" },
        include: { pages: { orderBy: { createdAt: "asc" } } },
      },
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
          <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
          <p className="text-gray-500 text-sm mt-1">
            Organise pages into groups. The analysis will check every page listed here.
            Custom checks can be scoped to one or more groups.
          </p>
        </div>
      </div>

      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
        <span className="font-medium">Base URL:</span>{" "}
        <span className="font-mono text-gray-800">{profile.url}</span>
        <span className="ml-2 text-gray-400">— paths are appended to this</span>
      </div>

      <PageGroupsClient profileId={profileId} initialGroups={profile.groups} />
    </div>
  );
}
