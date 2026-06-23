import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { makePodKey } from "@/lib/r2/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const r2 = new S3Client({
  region:   "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID     ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "courierflow-pod-dev";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

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
  /* DRIVER may upload only for their own delivery; ADMIN may upload for any
     delivery in their org (operating the driver flow / override). */
  const isDriver = driver.role === "DRIVER";
  if (!isDriver && driver.role !== "ADMIN") {
    return NextResponse.json({ error: "Only assigned drivers or admins can upload proof of delivery" }, { status: 403 });
  }

  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      organizationId: driver.organizationId,
      ...(isDriver ? { driverId: driver.id } : {}),
      status:         { in: ["IN_TRANSIT", "DELIVERED"] },
    },
    select: { id: true },
  });
  if (!delivery) {
    return NextResponse.json(
      { error: "Delivery not found or not in transit" },
      { status: 404 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PoD Upload] formData parse failed:", msg);
    return NextResponse.json({ error: "Could not parse uploaded files" }, { status: 400 });
  }

  const result: Record<string, string> = {};

  for (const field of ["photo", "signature"] as const) {
    const entry = formData.get(field);

    /* Skip missing or plain-string fields */
    if (!entry || typeof entry === "string") continue;

    /* FormData file entries implement Blob; use as Blob to avoid instanceof issues */
    const blob = entry as Blob;
    const contentType = blob.type || "image/jpeg";

    const ext = ALLOWED_TYPES[contentType];
    if (!ext) {
      console.warn(`[PoD Upload] Unsupported type for ${field}: ${contentType}`);
      return NextResponse.json(
        { error: `Unsupported file type for ${field}: ${contentType}` },
        { status: 422 },
      );
    }

    let bytes: ArrayBuffer;
    try {
      bytes = await blob.arrayBuffer();
    } catch (err) {
      console.error(`[PoD Upload] arrayBuffer() failed for ${field}:`, err);
      return NextResponse.json({ error: `Could not read ${field} data` }, { status: 400 });
    }

    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: `${field} file exceeds 8 MB limit` },
        { status: 422 },
      );
    }

    if (bytes.byteLength === 0) {
      console.warn(`[PoD Upload] Empty file for ${field} — skipping`);
      continue;
    }

    const key = makePodKey(id, field, ext);

    console.info(
      `[PoD Upload] Uploading ${field} → ${key}` +
      ` (${Math.round(bytes.byteLength / 1024)} KB, type=${contentType})`,
    );

    try {
      await r2.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        Buffer.from(bytes),
        ContentType: contentType,
      }));
      result[`${field}Key`] = key;
      console.info(`[PoD Upload] ${field} uploaded OK → ${key}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[PoD Upload] R2 upload failed for ${field}: ${msg}`);
      return NextResponse.json(
        { error: `Storage upload failed for ${field}: ${msg}` },
        { status: 502 },
      );
    }
  }

  console.info(`[PoD Upload] Done — keys: ${JSON.stringify(result)}`);
  return NextResponse.json(result);
}
