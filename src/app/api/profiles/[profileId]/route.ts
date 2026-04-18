import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedProfile(profileId: string, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) return null;
  if (profile.userId !== userId) return null;
  return profile;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await getOwnedProfile(profileId, session.user.id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(profile);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await getOwnedProfile(profileId, session.user.id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, url } = await req.json();

  const updated = await prisma.profile.update({
    where: { id: profileId },
    data: {
      ...(name ? { name } : {}),
      ...(url ? { url } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await getOwnedProfile(profileId, session.user.id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.profile.delete({ where: { id: profileId } });

  return new NextResponse(null, { status: 204 });
}
