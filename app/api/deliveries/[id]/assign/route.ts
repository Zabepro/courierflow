import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { sendDeliverySms } from "@/lib/sms/send";
import { smsMessages } from "@/lib/sms/messages";
import { recordAudit } from "@/lib/audit/log";

const assignSchema = z.object({
  driverId: z.string().min(1, "Driver ID is required"),
});

const TERMINAL = ["DELIVERED", "FAILED", "CANCELLED"] as const;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can assign drivers" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { driverId } = parsed.data;
  const { id: deliveryId } = await params;

  try {
    // EC-10: Serializable transaction prevents concurrent duplicate assignments
    const result = await prisma.$transaction(async (tx) => {
      // EC-17: org isolation
      const delivery = await tx.delivery.findFirst({
        where: { id: deliveryId, organizationId: user.organizationId },
        select: {
          id: true, status: true, driverId: true,
          trackingCode: true, recipientName: true,
          pickupAddress: true, deliveryAddress: true,
        },
      });

      if (!delivery) {
        throw Object.assign(new Error("Delivery not found"), { code: "NOT_FOUND" });
      }

      // Idempotent: same driver already assigned → return existing, no error
      if (delivery.driverId === driverId) {
        const current = await tx.delivery.findUnique({
          where: { id: deliveryId },
          include: { driver: { select: { id: true, name: true, phone: true } } },
        });
        return { delivery: current!, driver: null, alreadyAssigned: true };
      }

      // Block assignment on terminal states
      if (TERMINAL.includes(delivery.status as typeof TERMINAL[number])) {
        throw Object.assign(
          new Error(`Cannot assign a ${delivery.status.toLowerCase()} delivery`),
          { code: "INVALID_STATE" }
        );
      }

      // Validate driver belongs to same org
      const driver = await tx.user.findFirst({
        where: { id: driverId, organizationId: user.organizationId, role: "DRIVER" },
        select: { id: true, name: true, phone: true },
      });
      if (!driver) {
        throw Object.assign(
          new Error("Driver not found in your organization"),
          { code: "DRIVER_NOT_FOUND" }
        );
      }

      // Atomic assignment — row is locked within this serializable tx
      const updated = await tx.delivery.update({
        where: { id: deliveryId },
        data:  { driverId, status: "ASSIGNED" },
        include: { driver: { select: { id: true, name: true, phone: true } } },
      });

      return { delivery: updated, driver, alreadyAssigned: false };
    }, { isolationLevel: "Serializable" });

    if (!result.alreadyAssigned) {
      await recordAudit({
        organizationId: user.organizationId,
        actorId: user.id, actorName: user.name,
        action: "delivery.driver_assigned", entityType: "delivery", entityId: deliveryId,
        details: { driverName: result.driver?.name ?? null, trackingCode: result.delivery.trackingCode },
      });
    }

    // Non-blocking SMS to driver — failure doesn't affect the response
    if (!result.alreadyAssigned && result.driver?.phone) {
      const { trackingCode, pickupAddress, recipientName, deliveryAddress } = result.delivery;
      void sendDeliverySms({
        organizationId: user.organizationId,
        deliveryId,
        recipient:      result.driver.phone,
        message:        smsMessages.driverAssigned({ trackingCode, pickupAddress, recipientName, deliveryAddress }),
        idempotencyKey: `sms:${deliveryId}:ASSIGNED`,
      });
    }

    const d = result.delivery;
    return NextResponse.json({
      ...d,
      fee: d.fee != null ? String(d.fee) : null,
      alreadyAssigned: result.alreadyAssigned,
    });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    const status =
      err.code === "NOT_FOUND"        ? 404 :
      err.code === "DRIVER_NOT_FOUND" ? 404 :
      err.code === "INVALID_STATE"    ? 409 : 500;
    if (status < 500) return NextResponse.json({ error: err.message }, { status });
    console.error("[assign] unexpected error:", e);
    return NextResponse.json({ error: "Assignment failed" }, { status: 500 });
  }
}
