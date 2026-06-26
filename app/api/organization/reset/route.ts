import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/log";

/**
 * POST /api/organization/reset
 *
 * Permanently wipes all operational data for the caller's organisation —
 * deliveries, payments, GPS, proof-of-delivery, SMS logs and driver users —
 * while keeping the organisation and its admin account(s) intact.
 *
 * ADMIN only. Requires the exact organisation name in the body as a typed
 * confirmation, so it can never fire by accident.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!me?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (me.role !== "ADMIN") {
    return NextResponse.json({ error: "Only an admin can reset organisation data" }, { status: 403 });
  }

  const body    = await req.json().catch(() => null) as { confirm?: string } | null;
  const confirm = body?.confirm?.trim() ?? "";

  const org = await prisma.organization.findUnique({
    where:  { id: me.organizationId },
    select: { id: true, name: true },
  });
  if (!org) return NextResponse.json({ error: "Organisation not found" }, { status: 404 });

  /* Typed confirmation must match the organisation name exactly (case-insensitive). */
  if (confirm.toLowerCase() !== org.name.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "Confirmation text does not match the organisation name." },
      { status: 422 },
    );
  }

  const organizationId = org.id;

  /* FK-safe order: children before parents; location/driver links before users. */
  const [locations, payments, sms, proofs, deliveries, drivers] = await prisma.$transaction([
    prisma.locationUpdate.deleteMany({ where: { delivery: { organizationId } } }),
    prisma.payment.deleteMany({ where: { organizationId } }),
    prisma.smsLog.deleteMany({ where: { organizationId } }),
    prisma.proofOfDelivery.deleteMany({ where: { delivery: { organizationId } } }),
    prisma.delivery.deleteMany({ where: { organizationId } }),
    prisma.user.deleteMany({ where: { organizationId, id: { not: me.id } } }),
  ]);

  console.info(
    `[ORG RESET] org=${organizationId} by=${me.id} — ` +
    `deliveries=${deliveries.count} users=${drivers.count} payments=${payments.count} ` +
    `locations=${locations.count} proofs=${proofs.count} sms=${sms.count}`,
  );

  // Audit logs survive the reset on purpose — a wipe must remain accountable.
  await recordAudit({
    organizationId,
    actorId: me.id, actorName: null,
    action: "organization.reset", entityType: "organization", entityId: organizationId,
    details: { deliveries: deliveries.count, drivers: drivers.count, payments: payments.count },
  });

  return NextResponse.json({
    ok: true,
    deleted: {
      deliveries: deliveries.count,
      users:      drivers.count,
      payments:   payments.count,
      locations:  locations.count,
      proofs:     proofs.count,
      smsLogs:    sms.count,
    },
  });
}
