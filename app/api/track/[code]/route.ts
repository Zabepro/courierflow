import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const RATE_LIMIT = 10;
const WINDOW_SECONDS = 60;

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const rateLimit = await checkRateLimit(
    `rate:track:${getClientIp(req)}`,
    RATE_LIMIT,
    WINDOW_SECONDS
  );

  // Fail open: a Redis outage must not block public tracking — log and continue.
  if (rateLimit.unavailable) {
    console.warn("[track] rate limiter unavailable — allowing request through");
  } else if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(WINDOW_SECONDS) } }
    );
  }

  const code = rawCode.toUpperCase().trim();
  let delivery;
  try {
    delivery = await prisma.delivery.findFirst({
      where: { trackingCode: code },
      select: {
        trackingCode: true,
        status: true,
        priority: true,
        recipientName: true,
        pickupAddress: true,
        deliveryAddress: true,
        city: true,
        createdAt: true,
        pickedUpAt: true,
        deliveredAt: true,
        driver: { select: { name: true } },
        locationUpdates: { select: { timestamp: true }, orderBy: { timestamp: "desc" }, take: 1 },
      },
    });
  } catch (error) {
    console.error("[Tracking] Database lookup failed:", error);
    return NextResponse.json({ error: "Tracking is temporarily unavailable" }, { status: 503 });
  }

  if (!delivery) return NextResponse.json({ error: "Tracking code not found" }, { status: 404 });

  return NextResponse.json({
    trackingCode: delivery.trackingCode,
    status: delivery.status,
    priority: delivery.priority,
    recipientName: delivery.recipientName,
    pickupAddress: delivery.pickupAddress,
    deliveryAddress: delivery.deliveryAddress,
    city: delivery.city,
    driverName: delivery.driver?.name?.split(" ")[0] ?? null,
    createdAt: delivery.createdAt,
    pickedUpAt: delivery.pickedUpAt,
    deliveredAt: delivery.deliveredAt,
    lastUpdate: delivery.locationUpdates[0]?.timestamp ?? null,
  });
}
