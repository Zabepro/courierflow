import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";

const issueSchema = z.object({
  issueReason: z.string().min(3, "Tafadhali eleza tatizo kwa kirefu"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;

  if (user.role !== "DRIVER") {
    return NextResponse.json({ error: "Only drivers can report issues" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = issueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const delivery = await prisma.delivery.findUnique({
    where: { id, driverId: user.id },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Delivery not found or not assigned to you" }, { status: 404 });
  }

  try {
    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        hasIssue: true,
        issueReason: parsed.data.issueReason,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[issue] update error:", e);
    return NextResponse.json({ error: "Failed to report issue" }, { status: 500 });
  }
}
