import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ deliveryId: string }> },
) {
  const { deliveryId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { organizationId: true },
  });
  if (!user?.organizationId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payment = await prisma.payment.findFirst({
    where: {
      deliveryId,
      organizationId: user.organizationId,
    },
    select: {
      status:      true,
      method:      true,
      amount:      true,
      phoneNumber: true,
      paidAt:      true,
      mpesaCode:   true,
    },
  });

  if (!payment) return NextResponse.json(null);

  return NextResponse.json({
    ...payment,
    amount: payment.amount.toString(),
  });
}

const patchSchema = z.object({
  action: z.enum(["mark_paid", "cancel"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ deliveryId: string }> },
) {
  const { deliveryId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!user?.organizationId || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const payment = await prisma.payment.findFirst({
    where: { deliveryId, organizationId: user.organizationId },
    select: { id: true, status: true },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status === "PAID") {
    return NextResponse.json({ error: "Payment already completed" }, { status: 409 });
  }

  const { action } = parsed.data;

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data:  action === "mark_paid"
      ? { status: "PAID",   paidAt: new Date(), failureReason: null }
      : { status: "FAILED", failureReason: "Cancelled by admin" },
    select: { status: true, method: true, amount: true, phoneNumber: true, paidAt: true, mpesaCode: true },
  });

  return NextResponse.json({ ...updated, amount: updated.amount.toString() });
}
