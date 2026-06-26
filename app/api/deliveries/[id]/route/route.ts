import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { ensureDeliveryGeo } from "@/lib/geo/ensure";

/**
 * Map data for one delivery: geocoded pickup/dropoff, the planned road route,
 * and the trail travelled so far. Org-scoped — a DRIVER may only read their own
 * deliveries; ADMIN/VIEWER may read any in their organization.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;

  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      ...(user.role === "DRIVER" ? { driverId: user.id } : {}),
    },
    select: { id: true },
  });
  if (!delivery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const geo = await ensureDeliveryGeo(delivery.id);

  const points = await prisma.locationUpdate.findMany({
    where:   { deliveryId: delivery.id },
    orderBy: { timestamp: "asc" },
    select:  { latitude: true, longitude: true },
    take:    500,
  });

  return NextResponse.json({
    pickup:       geo.pickup,
    dropoff:      geo.dropoff,
    plannedRoute: geo.plannedRoute,
    trail:        points.map((p) => ({ lat: p.latitude, lng: p.longitude })),
  });
}
