import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { sendDeliverySms } from "@/lib/sms/send";
import { smsMessages } from "@/lib/sms/messages";

const statusSchema = z.object({
  status:      z.enum(["PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"]),
  notes:       z.string().optional(),
  pickedUpAt:  z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
});

// Valid status transitions (forward progression + terminal states)
const TRANSITIONS: Record<string, readonly string[]> = {
  PENDING:    ["CANCELLED", "FAILED"],
  ASSIGNED:   ["PICKED_UP", "FAILED", "CANCELLED"],
  PICKED_UP:  ["IN_TRANSIT", "FAILED"],
  IN_TRANSIT: ["DELIVERED", "FAILED"],
};

// Only ADMIN may cancel a delivery
const ADMIN_ONLY_STATUSES = new Set(["CANCELLED"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;
  if (user.role === "VIEWER") {
    return NextResponse.json({ error: "Viewers cannot update deliveries" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { status: newStatus } = parsed.data;

  if (ADMIN_ONLY_STATUSES.has(newStatus) && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can cancel a delivery" }, { status: 403 });
  }

  const delivery = await prisma.delivery.findFirst({
    where:  { id, organizationId: user.organizationId },
    select: {
      id: true, status: true, driverId: true,
      trackingCode: true,
      senderName: true, senderPhone: true,
      recipientName: true, recipientPhone: true,
      pickupAddress: true, deliveryAddress: true,
      organizationId: true,
    },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  const allowed = TRANSITIONS[delivery.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${delivery.status} to ${newStatus}` },
      { status: 409 }
    );
  }

  // Drivers can only update their own assigned delivery
  if (user.role === "DRIVER" && delivery.driverId !== user.id) {
    return NextResponse.json({ error: "You are not assigned to this delivery" }, { status: 403 });
  }

  const now = new Date();
  // Compare-and-set prevents two valid requests from overwriting each other's
  // state after both read the same delivery status.
  const updateResult = await prisma.delivery.updateMany({
    where: { id, organizationId: user.organizationId, status: delivery.status },
    data: {
      status: newStatus,
      ...(newStatus === "PICKED_UP"  && { pickedUpAt:  parsed.data.pickedUpAt  ? new Date(parsed.data.pickedUpAt)  : now }),
      ...(newStatus === "DELIVERED"  && { deliveredAt: parsed.data.deliveredAt ? new Date(parsed.data.deliveredAt) : now }),
    },
  });

  if (updateResult.count !== 1) {
    return NextResponse.json(
      { error: "Delivery status changed; refresh and try again" },
      { status: 409 }
    );
  }

  const updated = await prisma.delivery.findUniqueOrThrow({
    where: { id },
    include: { driver: { select: { id: true, name: true, phone: true } } },
  });

  // Non-blocking SMS notifications (US-CUS-02)
  void (async () => {
    try {
      if (newStatus === "PICKED_UP" && delivery.recipientPhone) {
        await sendDeliverySms({
          organizationId: delivery.organizationId,
          deliveryId:     delivery.id,
          recipient:      delivery.recipientPhone,
          message:        smsMessages.pickedUp({ recipientName: delivery.recipientName, trackingCode: delivery.trackingCode }),
          idempotencyKey: `sms:${delivery.id}:PICKED_UP`,
        });
      }

      if (newStatus === "IN_TRANSIT" && delivery.recipientPhone) {
        await sendDeliverySms({
          organizationId: delivery.organizationId,
          deliveryId:     delivery.id,
          recipient:      delivery.recipientPhone,
          message:        smsMessages.inTransit({ recipientName: delivery.recipientName, trackingCode: delivery.trackingCode }),
          idempotencyKey: `sms:${delivery.id}:IN_TRANSIT`,
        });
      }

      if (newStatus === "DELIVERED" && delivery.senderPhone) {
        await sendDeliverySms({
          organizationId: delivery.organizationId,
          deliveryId:     delivery.id,
          recipient:      delivery.senderPhone,
          message:        smsMessages.delivered({ trackingCode: delivery.trackingCode, recipientName: delivery.recipientName }),
          idempotencyKey: `sms:${delivery.id}:DELIVERED`,
        });
      }
    } catch (e) {
      console.error("[status] SMS notification error:", e);
    }
  })();

  return NextResponse.json({
    ...updated,
    fee: updated.fee != null ? String(updated.fee) : null,
  });
}
