import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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

  const { name, description, config, enabled } = await req.json();

  const updated = await prisma.customCheck.update({
    where: { id: checkId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(config !== undefined
        ? { config: typeof config === "string" ? config : JSON.stringify(config) }
        : {}),
      ...(enabled !== undefined ? { enabled } : {}),
    },
    include: { groups: { select: { groupId: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
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

  await prisma.customCheck.delete({ where: { id: checkId } });

  return new NextResponse(null, { status: 204 });
}
