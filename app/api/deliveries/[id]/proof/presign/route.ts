import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { makePodKey, getUploadPresignedUrl } from "@/lib/r2/client";

const bodySchema = z.object({
  photoType:     z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
  signatureType: z.literal("image/png").optional(),
});

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
    return NextResponse.json({ error: "Only assigned drivers can upload proof of delivery" }, { status: 403 });
  }

  /* EC-14: delivery must be IN_TRANSIT and owned by this driver */
  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      organizationId: driver.organizationId,
      driverId:       driver.id,
      status:         "IN_TRANSIT",
    },
    select: { id: true },
  });
  if (!delivery) {
    return NextResponse.json(
      { error: "Delivery not found or not in transit" },
      { status: 404 },
    );
  }

  const body   = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const { photoType, signatureType } = parsed.data;
  if (!photoType && !signatureType) {
    return NextResponse.json(
      { error: "Specify at least photoType or signatureType" },
      { status: 422 },
    );
  }

  const result: Record<string, { uploadUrl: string; key: string }> = {};

  if (photoType) {
    const ext = photoType === "image/jpeg" ? "jpg" : photoType.split("/")[1];
    const key = makePodKey(id, "photo", ext);
    result.photo = { uploadUrl: await getUploadPresignedUrl(key, photoType), key };
  }

  if (signatureType) {
    const key = makePodKey(id, "signature", "png");
    result.signature = { uploadUrl: await getUploadPresignedUrl(key, "image/png"), key };
  }

  return NextResponse.json(result);
}
