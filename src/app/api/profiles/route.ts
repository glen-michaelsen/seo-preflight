import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { analyses: true, checks: true } },
      analyses: {
        take: 1,
        orderBy: { startedAt: "desc" },
        select: { id: true, status: true, startedAt: true, completedAt: true },
      },
    },
  });

  return NextResponse.json(profiles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, url } = await req.json();

  if (!name || !url) {
    return NextResponse.json({ error: "Name and URL are required." }, { status: 400 });
  }

  let normalizedUrl: string;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    normalizedUrl = parsed.toString();
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  const profile = await prisma.profile.create({
    data: { name, url: normalizedUrl, userId: session.user.id },
  });

  return NextResponse.json(profile, { status: 201 });
}
