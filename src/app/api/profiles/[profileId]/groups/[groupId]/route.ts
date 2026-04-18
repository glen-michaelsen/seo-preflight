import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedGroup(groupId: string, profileId: string, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== userId) return null;
  const group = await prisma.pageGroup.findUnique({ where: { id: groupId } });
  if (!group || group.profileId !== profileId) return null;
  return group;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string; groupId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, groupId } = await params;
  const group = await getOwnedGroup(groupId, profileId, session.user.id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Group name is required." }, { status: 400 });
  }

  const updated = await prisma.pageGroup.update({
    where: { id: groupId },
    data: { name: name.trim() },
    include: { pages: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string; groupId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, groupId } = await params;
  const group = await getOwnedGroup(groupId, profileId, session.user.id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.pageGroup.delete({ where: { id: groupId } });

  return new NextResponse(null, { status: 204 });
}
