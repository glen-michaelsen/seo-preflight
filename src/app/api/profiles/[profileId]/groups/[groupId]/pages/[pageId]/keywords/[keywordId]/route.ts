import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{
      profileId: string;
      groupId: string;
      pageId: string;
      keywordId: string;
    }>;
  }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, keywordId } = await params;

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.keyword.delete({ where: { id: keywordId } });

  return new NextResponse(null, { status: 204 });
}
