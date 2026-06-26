import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (user.role !== "DRIVER") {
    return NextResponse.json({ error: "Only drivers can change their status" }, { status: 403 });
  }

  try {
    const { isOnline } = await req.json();
    if (typeof isOnline !== "boolean") {
      return NextResponse.json({ error: "Invalid boolean value for isOnline" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isOnline },
      select: { isOnline: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[driver status] update error:", e);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
