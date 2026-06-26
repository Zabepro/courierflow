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

  // Geocode any delivery still missing coordinates in the background, so the
  // next poll has its pickup/dropoff + planned route ready (non-blocking).
  for (const d of deliveries) {
    if (d.pickupLat == null || d.deliveryLat == null) void ensureDeliveryGeo(d.id);
  }

  const result = deliveries.map((d) => {
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
      pickup:        d.pickupLat   != null && d.pickupLng   != null ? { lat: d.pickupLat,   lng: d.pickupLng   } : null,
      dropoff:       d.deliveryLat != null && d.deliveryLng != null ? { lat: d.deliveryLat, lng: d.deliveryLng } : null,
      plannedRoute:  (d.plannedRoute as unknown as LatLng[] | null) ?? null,
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
  });

  return NextResponse.json(result);
}
