import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { DriverHomeView } from "@/components/driver/driver-home-view";


export default async function DriverHomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, name: true, role: true, organizationId: true, isOnline: true },
  });
  if (!user || !user.organizationId) redirect("/sync");

  const isDriver = user.role === "DRIVER";

  /* DRIVERs see only their own deliveries; ADMINs see all active org deliveries */
  const deliveries = await prisma.delivery.findMany({
    where: {
      ...(isDriver ? { driverId: user.id } : { organizationId: user.organizationId! }),
      status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true, trackingCode: true, status: true, priority: true,
      deliveryAddress: true, recipientName: true, city: true,
      driver: { select: { name: true } },
    },
  });

  const deliveriesDeliveredToday = await prisma.delivery.findMany({
    where: {
      ...(isDriver ? { driverId: user.id } : { organizationId: user.organizationId! }),
      status:      "DELIVERED",
      deliveredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    select: { fee: true },
  });

  const completedToday = deliveriesDeliveredToday.length;
  const cashCollectedToday = deliveriesDeliveredToday.reduce((sum, d) => sum + (Number(d.fee) || 0), 0);

  const toPickup  = deliveries.filter((d) => d.status === "ASSIGNED").length;
  const onTheRoad = deliveries.filter((d) => d.status === "PICKED_UP" || d.status === "IN_TRANSIT").length;

  return (
    <DriverHomeView
      userName={user.name}
      isDriver={isDriver}
      initialIsOnline={user.isOnline}
      deliveries={deliveries}
      completedToday={completedToday}
      cashCollectedToday={cashCollectedToday}
      toPickup={toPickup}
      onTheRoad={onTheRoad}
    />
  );
}
