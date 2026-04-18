import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["CONTAINS", "NOT_CONTAINS", "REGEX", "SELECTOR_EXISTS", "META_TAG"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const checks = await prisma.customCheck.findMany({
    where: { profileId },
    orderBy: { createdAt: "asc" },
    include: { groups: { select: { groupId: true } } },
  });

  return NextResponse.json(checks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name, description, type, config } = await req.json();

  if (!name || !type || !config) {
    return NextResponse.json(
      { error: "name, type, and config are required." },
      { status: 400 }
    );
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid check type." }, { status: 400 });
  }

  // Validate config is parseable JSON
  try {
    JSON.parse(typeof config === "string" ? config : JSON.stringify(config));
  } catch {
    return NextResponse.json({ error: "config must be valid JSON." }, { status: 400 });
  }

  const check = await prisma.customCheck.create({
    data: {
      profileId,
      name,
      description: description || null,
      type,
      config: typeof config === "string" ? config : JSON.stringify(config),
    },
    include: { groups: { select: { groupId: true } } },
  });

  return NextResponse.json(check, { status: 201 });
}
