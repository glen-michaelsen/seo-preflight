import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { STANDARD_CHECK_IDS } from "@/lib/analysis/standard-checks-catalog";

// PUT — replace the full disabled-checks list for this profile
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const disabledChecks: string[] = (body.disabledChecks ?? []).filter((id: unknown) =>
    STANDARD_CHECK_IDS.includes(id as string)
  );

  const updated = await prisma.profile.update({
    where: { id: profileId },
    data: { disabledChecks: JSON.stringify(disabledChecks) },
    select: { disabledChecks: true },
  });

  return NextResponse.json({ disabledChecks: JSON.parse(updated.disabledChecks ?? "[]") });
}
