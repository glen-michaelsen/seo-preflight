import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string; groupId: string; pageId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, groupId, pageId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.groupId !== groupId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { path, label } = await req.json();
  const normPath = path?.trim()
    ? path.trim().startsWith("/")
      ? path.trim()
      : `/${path.trim()}`
    : undefined;

  const updated = await prisma.page.update({
    where: { id: pageId },
    data: {
      ...(normPath !== undefined ? { path: normPath } : {}),
      ...(label !== undefined ? { label: label?.trim() || null } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string; groupId: string; pageId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, groupId, pageId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.groupId !== groupId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.page.delete({ where: { id: pageId } });

  return new NextResponse(null, { status: 204 });
}
