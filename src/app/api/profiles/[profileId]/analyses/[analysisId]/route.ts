import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string; analysisId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, analysisId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
  if (!analysis || analysis.profileId !== profileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...analysis,
    results: analysis.results ? JSON.parse(analysis.results) : null,
  });
}
