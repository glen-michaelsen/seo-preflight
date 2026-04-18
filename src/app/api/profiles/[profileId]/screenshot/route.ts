import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MSHOTS_BASE = "https://s0.wp.com/mshots/v1";
// mshots redirects to this placeholder URL while it's still rendering
const PLACEHOLDER_MARKER = "/default";

async function fetchScreenshot(url: string): Promise<{ data: string } | { pending: true }> {
  const mshotsUrl = `${MSHOTS_BASE}/${encodeURIComponent(url)}?w=800&h=533`;

  const res = await fetch(mshotsUrl, {
    redirect: "follow",
    // 10s timeout
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return { pending: true };

  // If mshots hasn't rendered yet it redirects to a "default" placeholder
  if (res.url.includes(PLACEHOLDER_MARKER)) return { pending: true };

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const base64 = Buffer.from(buffer).toString("base64");
  return { data: `data:${contentType};base64,${base64}` };
}

// GET — return the cached screenshot (or null if not yet generated)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { userId: true, screenshotData: true, screenshotUpdatedAt: true },
  });
  if (!profile || profile.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    screenshotData: profile.screenshotData ?? null,
    screenshotUpdatedAt: profile.screenshotUpdatedAt ?? null,
  });
}

// POST — (re)generate and cache the screenshot
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { userId: true, url: true },
  });
  if (!profile || profile.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await fetchScreenshot(profile.url);

  if ("pending" in result) {
    // mshots hasn't rendered yet — tell the client to retry
    return NextResponse.json({ pending: true });
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: { screenshotData: result.data, screenshotUpdatedAt: new Date() },
  });

  return NextResponse.json({ screenshotData: result.data, pending: false });
}
