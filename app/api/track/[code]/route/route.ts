import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { ensureDeliveryGeo } from "@/lib/geo/ensure";

const RATE_LIMIT = 20;
const WINDOW_SECONDS = 60;

/**
 * Public map data for a tracking code: the geocoded pickup/dropoff points, the
 * planned road route between them, the trail the driver has actually travelled,
 * and the latest live position. One-shot fetch on page load; live updates keep
 * flowing via the SSE /stream endpoint.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;

  const rateLimit = await checkRateLimit(`rate:track-route:${getClientIp(req)}`, RATE_LIMIT, WINDOW_SECONDS);
  if (!rateLimit.unavailable && !rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const code = rawCode.toUpperCase().trim();

  const delivery = await prisma.delivery.findFirst({
    where:  { trackingCode: code },
    select: { id: true, status: true },
  });
  if (!delivery) return NextResponse.json({ error: "Tracking code not found" }, { status: 404 });

  const geo = await ensureDeliveryGeo(delivery.id);

  // The path actually driven so far (oldest → newest), capped for payload size.
  const points = await prisma.locationUpdate.findMany({
    where:   { deliveryId: delivery.id },
    orderBy: { timestamp: "asc" },
    select:  { latitude: true, longitude: true, timestamp: true },
    take:    500,
  });

  const trail   = points.map((p) => ({ lat: p.latitude, lng: p.longitude, ts: p.timestamp }));
  const last    = trail[trail.length - 1];
  const current = last ? { lat: last.lat, lng: last.lng, ts: last.ts } : null;

  return NextResponse.json({
    status:       delivery.status,
    pickup:       geo.pickup,
    dropoff:      geo.dropoff,
    plannedRoute: geo.plannedRoute,
    trail,
    current,
  });
}
