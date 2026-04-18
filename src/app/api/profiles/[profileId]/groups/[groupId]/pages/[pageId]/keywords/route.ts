import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      profileId: string;
      groupId: string;
      pageId: string;
    }>;
  }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, pageId } = await params;
  const { keyword } = await req.json();

  if (!keyword?.trim()) {
    return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const created = await prisma.keyword.create({
    data: { pageId, keyword: keyword.trim().toLowerCase() },
  });

  return NextResponse.json(created, { status: 201 });
}
