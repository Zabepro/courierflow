import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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
        take:    1,
        select:  { latitude: true, longitude: true, accuracy: true, timestamp: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = deliveries.map((d) => ({
    deliveryId:    d.id,
    trackingCode:  d.trackingCode,
    status:        d.status as string,
    recipientName: d.recipientName,
    city:          d.city,
    driverId:      d.driver!.id,
    driverName:    d.driver!.name ?? "Unknown Driver",
    driverPhone:   d.driver!.phone ?? null,
    location:      d.locationUpdates[0]
      ? {
          lat:      d.locationUpdates[0].latitude,
          lng:      d.locationUpdates[0].longitude,
          accuracy: d.locationUpdates[0].accuracy ?? null,
          ts:       d.locationUpdates[0].timestamp.toISOString(),
        }
      : null,
  }));

  return NextResponse.json(result);
}
