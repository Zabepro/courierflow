import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getSignedPhotoUrl } from "@/lib/r2/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const driver = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!driver?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (driver.role !== "DRIVER") {
    return NextResponse.json({ error: "Only assigned drivers can submit proof of delivery" }, { status: 403 });
  }

  /* delivery must be IN_TRANSIT or DELIVERED (allow idempotent retry) */
  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      organizationId: driver.organizationId,
      driverId:       driver.id,
      status:         { in: ["IN_TRANSIT", "DELIVERED"] },
    },
    select: { id: true, status: true },
  });
  if (!delivery) {
    return NextResponse.json(
      { error: "Delivery not found or not in transit" },
      { status: 404 },
    );
  }

  /* ── Parse JSON body (files were uploaded directly to R2 via presigned URLs) ── */
  const body   = await req.json().catch(() => null);
  const schema = z.object({
    recipientName: z.string().min(1).max(100),
    notes:         z.string().max(500).optional(),
    lat:           z.number().optional(),
    lng:           z.number().optional(),
    photoKey:      z.string().optional(),
    signatureKey:  z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { recipientName, notes, lat, lng, photoKey, signatureKey } = parsed.data;

  /* Validate R2 keys belong to this delivery (prevent key injection) */
  const keyPrefix = `pod/${id}/`;
  if (photoKey     && !photoKey.startsWith(keyPrefix))     return NextResponse.json({ error: "Invalid photo key"     }, { status: 422 });
  if (signatureKey && !signatureKey.startsWith(keyPrefix)) return NextResponse.json({ error: "Invalid signature key" }, { status: 422 });

  const now = new Date();

  const podData = {
    recipientName,
    notes:     notes        ?? null,
    latitude:  lat          ?? null,
    longitude: lng          ?? null,
    photoUrl:  photoKey     ?? null,
    signature: signatureKey ?? null,
  };

  try {
    const [pod] = await prisma.$transaction([
      /* upsert — idempotent on retry (unique constraint on deliveryId) */
      prisma.proofOfDelivery.upsert({
        where:  { deliveryId: id },
        create: { deliveryId: id, ...podData },
        update: podData,
      }),
      /* update delivery only if still IN_TRANSIT — already DELIVERED on retry is fine */
      prisma.delivery.updateMany({
        where: { id, status: "IN_TRANSIT" },
        data:  { status: "DELIVERED", deliveredAt: now },
      }),
    ]);

    console.info(
      `[POD] deliveryId=${id} driverId=${driver.id}` +
      ` recipient="${recipientName}" photo=${photoKey ? "yes" : "no"} sig=${signatureKey ? "yes" : "no"}`,
    );

    return NextResponse.json({ ok: true, podId: pod.id, deliveredAt: now });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[POD] Transaction failed for deliveryId=${id}:`, msg);
    return NextResponse.json({ error: "Failed to save proof of delivery" }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { organizationId: true },
  });
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const delivery = await prisma.delivery.findFirst({
    where:  { id, organizationId: user.organizationId },
    select: { proofOfDelivery: true },
  });
  if (!delivery) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pod = delivery.proofOfDelivery;
  if (!pod) return NextResponse.json(null);

  /* Generate 1-hour presigned GET URLs for both assets */
  const [photoUrl, signatureUrl] = await Promise.all([
    pod.photoUrl  ? getSignedPhotoUrl(pod.photoUrl).catch(() => null)  : Promise.resolve(null),
    pod.signature ? getSignedPhotoUrl(pod.signature).catch(() => null) : Promise.resolve(null),
  ]);

  return NextResponse.json({ ...pod, photoUrl, signatureUrl });
}
