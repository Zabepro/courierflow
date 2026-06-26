import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureDeliveryGeo } from "@/lib/geo/ensure";
import type { LatLng } from "@/lib/geo/geocode";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, role: true, organizationId: true },
  });

  if (!user?.organizationId || user.role === "DRIVER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deliveries = await prisma.delivery.findMany({
    where: {
      organizationId: user.organizationId,
      status:         { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] },
      driverId:       { not: null },
    },
    include: {
      driver: { select: { id: true, name: true, phone: true } },
      locationUpdates: {
        orderBy: { timestamp: "desc" },
        take:    60,
        select:  { latitude: true, longitude: true, accuracy: true, timestamp: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Resolve (and cache) each delivery's pickup/dropoff + planned route. We must
  // await — on serverless a fire-and-forget promise is frozen once we respond,
  // so the geocode would never persist. Cached after the first hit, so this is
  // only slow on the very first poll for a brand-new delivery.
  const result = await Promise.all(deliveries.map(async (d) => {
    let pickup       = d.pickupLat   != null && d.pickupLng   != null ? { lat: d.pickupLat,   lng: d.pickupLng   } : null;
    let dropoff      = d.deliveryLat != null && d.deliveryLng != null ? { lat: d.deliveryLat, lng: d.deliveryLng } : null;
    let plannedRoute = (d.plannedRoute as unknown as LatLng[] | null) ?? null;
    // Geocode only while coordinates are still missing — once set we stop, so we
    // never hammer Nominatim/OSRM on the 5s poll loop.
    if (!pickup || !dropoff) {
      const geo = await ensureDeliveryGeo(d.id);
      pickup = geo.pickup; dropoff = geo.dropoff; plannedRoute = geo.plannedRoute;
    }

    const latest = d.locationUpdates[0];
    // Oldest → newest, for drawing the path actually driven.
    const trail: LatLng[] = [...d.locationUpdates]
      .reverse()
      .map((p) => ({ lat: p.latitude, lng: p.longitude }));

    return {
      deliveryId:    d.id,
      trackingCode:  d.trackingCode,
      status:        d.status as string,
      recipientName: d.recipientName,
      city:          d.city,
      driverId:      d.driver!.id,
      driverName:    d.driver!.name ?? "Unknown Driver",
      driverPhone:   d.driver!.phone ?? null,
      pickup,
      dropoff,
      plannedRoute,
      trail,
      location:      latest
        ? {
            lat:      latest.latitude,
            lng:      latest.longitude,
            accuracy: latest.accuracy ?? null,
            ts:       latest.timestamp.toISOString(),
          }
        : null,
    };
  }));

  return NextResponse.json(result);
}
