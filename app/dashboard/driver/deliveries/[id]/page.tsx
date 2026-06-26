import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { DriverDeliveryPage } from "./driver-delivery-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!user || !user.organizationId) redirect("/sign-in");

  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      /* DRIVER: only their own delivery; ADMIN: any in org (for testing) */
      ...(user.role === "DRIVER" ? { driverId: user.id } : {}),
    },
    include: {
      driver:       { select: { id: true, name: true, phone: true } },
      organization: { select: { phone: true, name: true } },
    },
  });
  if (!delivery) notFound();

  /* Serialize non-JSON-safe values before passing to Client Component */
  const serialized = {
    ...delivery,
    fee:         delivery.fee?.toString()            ?? null,
    pickedUpAt:  delivery.pickedUpAt?.toISOString()  ?? null,
    deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
    scheduledAt: delivery.scheduledAt?.toISOString() ?? null,
    createdAt:   delivery.createdAt.toISOString(),
    updatedAt:   delivery.updatedAt.toISOString(),
  };

  return (
    <DriverDeliveryPage
      delivery={serialized}
      orgPhone={delivery.organization.phone ?? null}
      orgName={delivery.organization.name}
      isDriver={user.role === "DRIVER"}
    />
  );
}
