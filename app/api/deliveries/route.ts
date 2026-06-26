import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createDeliverySchema, deliveryFiltersSchema } from "@/lib/validations/delivery";
import { generateTrackingCode } from "@/lib/utils";
import { sendDeliverySms } from "@/lib/sms/send";
import { smsMessages } from "@/lib/sms/messages";
import { getRoute } from "@/lib/geo/geocode";

// ── GET /api/deliveries ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = deliveryFiltersSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramu batili", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { status, driverId, trackingCode, from, to, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where = {
    organizationId: user.organizationId, // EC-17: tenant isolation
    ...(status        && { status }),
    ...(driverId      && { driverId }),
    ...(trackingCode  && { trackingCode: { contains: trackingCode.toUpperCase(), mode: "insensitive" as const } }),
    ...((from || to)  && {
      createdAt: {
        ...(from && { gte: new Date(from) }),
        ...(to   && { lte: new Date(to)   }),
      },
    }),
  };

  const [rawDeliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: {
        driver:  { select: { id: true, name: true, phone: true } },
        payment: { select: { status: true, method: true, amount: true, phoneNumber: true, paidAt: true, mpesaCode: true, failureReason: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.delivery.count({ where }),
  ]);

  // Serialize Decimal → string for JSON transport
  const deliveries = rawDeliveries.map((d) => ({
    ...d,
    fee:     d.fee?.toString() ?? null,
    payment: d.payment ? {
      ...d.payment,
      amount: d.payment.amount?.toString() ?? null,
    } : null,
  }));

  return NextResponse.json({
    data: deliveries,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

// ── POST /api/deliveries ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can create deliveries" }, { status: 403 });
  }

  // Throttle creation per user to prevent runaway/abusive writes (EC-17)
  const limited = await enforceRateLimit(`rate:deliveries:create:${user.id}`, 60, 60);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON batili" }, { status: 400 });
  }

  const parsed = createDeliverySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation imeshindwa", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Generate unique tracking code (retry up to 5x on collision)
  let trackingCode: string | null = null;
  for (let i = 0; i < 5; i++) {
    const candidate = generateTrackingCode();
    const exists = await prisma.delivery.findUnique({
      where: { trackingCode: candidate },
      select: { id: true },
    });
    if (!exists) { trackingCode = candidate; break; }
  }
  if (!trackingCode) {
    return NextResponse.json({ error: "Imeshindwa kutengeneza tracking code" }, { status: 500 });
  }

  const { fee, scheduledAt, ...rest } = parsed.data;

  // If the address picker captured both endpoints, precompute the road route
  // now so every map has it instantly — no lazy geocoding needed later.
  let plannedRoute: { lat: number; lng: number }[] | undefined;
  if (rest.pickupLat != null && rest.pickupLng != null && rest.deliveryLat != null && rest.deliveryLng != null) {
    const route = await getRoute(
      { lat: rest.pickupLat, lng: rest.pickupLng },
      { lat: rest.deliveryLat, lng: rest.deliveryLng },
    );
    if (route) plannedRoute = route;
  }

  const delivery = await prisma.delivery.create({
    data: {
      ...rest,
      organizationId: user.organizationId,
      trackingCode,
      fee:         fee          != null ? String(fee)          : null,
      scheduledAt: scheduledAt  != null ? new Date(scheduledAt) : null,
      ...(plannedRoute ? { plannedRoute } : {}),
    },
    include: {
      driver: { select: { id: true, name: true, phone: true } },
    },
  });

  // Non-blocking confirmation SMS to sender (optional — skipped if AT not configured)
  void sendDeliverySms({
    organizationId: user.organizationId,
    deliveryId:     delivery.id,
    recipient:      delivery.senderPhone,
    message:        smsMessages.deliveryCreated({ trackingCode, recipientName: delivery.recipientName }),
    idempotencyKey: `sms:${delivery.id}:CREATED`,
  });

  return NextResponse.json(
    { ...delivery, fee: delivery.fee?.toString() ?? null },
    { status: 201 }
  );
}
