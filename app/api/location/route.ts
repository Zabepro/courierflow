import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { enforceRateLimit } from "@/lib/security/rate-limit";

/* ── Constants ─────────────────────────────────────────────────────────────── */

/* Tanzania bounding box — soft sanity check (EC-03) */
const TZ = { minLat: -11.76, maxLat: -0.99, minLng: 29.33, maxLng: 40.44 };

/* Maximum realistic vehicle speed in Tanzania (km/h) */
const MAX_SPEED_KMH = 200;

/* ── Haversine distance formula ────────────────────────────────────────────── */

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Validation schema ─────────────────────────────────────────────────────── */

const schema = z.object({
  deliveryId: z.string().min(1),
  lat:        z.number().min(-90).max(90),
  lng:        z.number().min(-180).max(180),
  accuracy:   z.number().positive().optional(),
  speed:      z.number().nonnegative().optional(),
  heading:    z.number().min(0).max(360).optional(),
  /* Security fields */
  isMock:     z.boolean().optional(),   // native app: LocationManager.isFromMockProvider()
  /* Offline sync fields */
  offline:    z.boolean().optional(),   // true when this point was queued offline
  queuedAt:   z.string().datetime().optional(), // original capture time (for route reconstruction)
});

/* ── Route handler ─────────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid coordinates (EC-03)", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { deliveryId, lat, lng, accuracy, speed, heading, isMock, offline, queuedAt } = parsed.data;

  /* ── SECURITY: Reject confirmed fake GPS (from native apps that can detect it) */
  if (isMock === true) {
    console.warn(`[GPS_MOCK] deliveryId=${deliveryId} userId=${userId}`);
    return NextResponse.json(
      { error: "Fake GPS detected — location rejected", code: "MOCK_GPS" },
      { status: 422 }
    );
  }

  /* ── Auth & ownership check ──────────────────────────────────────────────── */

  const driver = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!driver?.organizationId) {
    return NextResponse.json({ error: "User not found" }, { status: 403 });
  }
  /* DRIVER submits for their own delivery; ADMIN may submit for any delivery in
     their org (operating the driver flow / testing live tracking). */
  const isDriver = driver.role === "DRIVER";
  if (!isDriver && driver.role !== "ADMIN") {
    return NextResponse.json({ error: "Only drivers can submit locations" }, { status: 403 });
  }

  // Generous cap (live GPS pings every few seconds + offline-sync bursts) that
  // still stops a single driver from flooding the table.
  const limited = await enforceRateLimit(`rate:location:${driver.id}`, 240, 60);
  if (limited) return limited;

  const delivery = await prisma.delivery.findFirst({
    where: {
      id:             deliveryId,
      organizationId: driver.organizationId,
      ...(isDriver ? { driverId: driver.id } : {}),
      status:         { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] },
    },
    select: { id: true, driverId: true },
  });
  if (!delivery) {
    return NextResponse.json({ error: "Delivery not found or not active" }, { status: 404 });
  }

  /* ── SECURITY: Velocity check — live GPS only (skip offline sync) ──────── */
  if (!offline) {
    const lastLoc = await prisma.locationUpdate.findFirst({
      where:   { deliveryId },
      orderBy: { timestamp: "desc" },
      select:  { latitude: true, longitude: true, timestamp: true },
    });

    if (lastLoc) {
      const distKm     = haversineKm(lastLoc.latitude, lastLoc.longitude, lat, lng);
      /* Use at least 0.0001 hours (0.36 s) to avoid division-by-zero on rapid pings */
      const elapsedHrs = Math.max(
        (Date.now() - lastLoc.timestamp.getTime()) / 3_600_000,
        0.0001
      );
      const speedKmH = distKm / elapsedHrs;

      if (speedKmH > MAX_SPEED_KMH) {
        console.warn(
          `[GPS_FRAUD] deliveryId=${deliveryId} driverId=${driver.id}` +
          ` speed=${Math.round(speedKmH)}km/h dist=${distKm.toFixed(2)}km` +
          ` elapsed=${(elapsedHrs * 3600).toFixed(1)}s`
        );
        return NextResponse.json(
          {
            error:    "Location rejected — impossible speed detected",
            code:     "IMPOSSIBLE_SPEED",
            speedKmH: Math.round(speedKmH),
          },
          { status: 422 }
        );
      }
    }
  }

  /* ── Store location ──────────────────────────────────────────────────────── */

  /* For offline sync, restore the original capture time so route timeline is accurate */
  const capturedAt = offline && queuedAt ? new Date(queuedAt) : undefined;

  const loc = await prisma.locationUpdate.create({
    data: {
      deliveryId,
      driverId:  delivery.driverId ?? driver.id,
      latitude:  lat,
      longitude: lng,
      accuracy:  accuracy ?? null,
      speed:     speed    ?? null,
      heading:   heading  ?? null,
      ...(capturedAt ? { timestamp: capturedAt } : {}),
    },
    select: { id: true, timestamp: true },
  });

  const inTanzania =
    lat >= TZ.minLat && lat <= TZ.maxLat &&
    lng >= TZ.minLng && lng <= TZ.maxLng;

  return NextResponse.json({
    ok:          true,
    id:          loc.id,
    timestamp:   loc.timestamp,
    inTanzania,
    offline:     offline ?? false,
  });
}
