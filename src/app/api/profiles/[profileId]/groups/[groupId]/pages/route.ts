import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string; groupId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, groupId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const group = await prisma.pageGroup.findUnique({ where: { id: groupId } });
  if (!group || group.profileId !== profileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { path, label } = await req.json();
  if (!path?.trim()) {
    return NextResponse.json({ error: "Path is required." }, { status: 400 });
  }

  // Normalise: must start with /
  const normPath = path.trim().startsWith("/") ? path.trim() : `/${path.trim()}`;

  const page = await prisma.page.create({
    data: { groupId, path: normPath, label: label?.trim() || null },
  });

  return NextResponse.json(page, { status: 201 });
}
