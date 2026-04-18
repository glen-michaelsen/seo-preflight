import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PUT replaces the full set of group assignments for a check
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string; checkId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, checkId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const check = await prisma.customCheck.findUnique({ where: { id: checkId } });
  if (!check || check.profileId !== profileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { groupIds } = await req.json() as { groupIds: string[] };

  // Verify all groupIds belong to this profile
  if (groupIds.length > 0) {
    const groups = await prisma.pageGroup.findMany({
      where: { id: { in: groupIds }, profileId },
    });
    if (groups.length !== groupIds.length) {
      return NextResponse.json({ error: "Invalid group IDs." }, { status: 400 });
    }
  }

  // Replace all assignments
  await prisma.customCheckOnGroup.deleteMany({ where: { checkId } });
  if (groupIds.length > 0) {
    await prisma.customCheckOnGroup.createMany({
      data: groupIds.map((groupId) => ({ checkId, groupId })),
    });
  }

  return NextResponse.json({ checkId, groupIds });
}
