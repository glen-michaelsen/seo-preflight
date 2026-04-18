import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  const { scheduleType, scheduleDayOfWeek, scheduleDayOfMonth } = body;

  // Validate
  if (scheduleType && !["weekly", "monthly"].includes(scheduleType))
    return NextResponse.json({ error: "Invalid scheduleType" }, { status: 400 });
  if (scheduleType === "weekly" && (scheduleDayOfWeek < 0 || scheduleDayOfWeek > 6))
    return NextResponse.json({ error: "Invalid scheduleDayOfWeek" }, { status: 400 });
  if (scheduleType === "monthly" && (scheduleDayOfMonth < 1 || scheduleDayOfMonth > 31))
    return NextResponse.json({ error: "Invalid scheduleDayOfMonth" }, { status: 400 });

  const updated = await prisma.profile.update({
    where: { id: profileId },
    data: {
      scheduleType: scheduleType ?? null,
      scheduleDayOfWeek: scheduleType === "weekly" ? scheduleDayOfWeek : null,
      scheduleDayOfMonth: scheduleType === "monthly" ? scheduleDayOfMonth : null,
    },
    select: {
      scheduleType: true,
      scheduleDayOfWeek: true,
      scheduleDayOfMonth: true,
    },
  });

  return NextResponse.json(updated);
}
