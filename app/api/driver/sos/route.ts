import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendSms } from "@/lib/sms/africas-talking";

const schema = z.object({
  deliveryId: z.string().min(1),
  lat:        z.number().optional(),
  lng:        z.number().optional(),
  message:    z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const { deliveryId, lat, lng, message } = parsed.data;

  const driver = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, name: true, phone: true, role: true, organizationId: true },
  });
  if (!driver?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const isDriver = driver.role === "DRIVER";
  if (!isDriver && driver.role !== "ADMIN") {
    return NextResponse.json({ error: "Only drivers can send SOS alerts" }, { status: 403 });
  }

  const delivery = await prisma.delivery.findFirst({
    where: {
      id:             deliveryId,
      organizationId: driver.organizationId,
      ...(isDriver ? { driverId: driver.id } : {}),
    },
    select: {
      id:           true,
      trackingCode: true,
      organization: { select: { phone: true, name: true } },
    },
  });
  if (!delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  const orgPhone = delivery.organization.phone;
  const driverName = driver.name ?? "Driver";
  const now  = new Date().toLocaleTimeString("sw-TZ", { hour: "2-digit", minute: "2-digit" });

  /* Build SMS lines */
  const mapsUrl   = lat && lng ? `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}` : null;
  const locLine   = mapsUrl ? `Mahali: ${mapsUrl}` : "Mahali: GPS haipatikani";
  const msgLine   = message ? `Ujumbe: ${message}` : "";

  const smsText = [
    `SOS ALERT — ${driverName}`,
    `Delivery: ${delivery.trackingCode}`,
    locLine,
    msgLine,
    `Wakati: ${now}`,
    `CourierFlow Alert`,
  ].filter(Boolean).join("\n");

  let smsSent  = false;
  let smsError = "";

  if (orgPhone) {
    const result = await sendSms(orgPhone, smsText);
    smsSent  = result.success;
    smsError = result.success ? "" : result.error;
    if (!result.success) {
      console.error(`[SOS_SMS_FAIL] deliveryId=${deliveryId} error=${result.error}`);
    } else {
      console.info(`[SOS_SMS_OK] deliveryId=${deliveryId} to=${orgPhone}`);
    }
  } else {
    console.warn(`[SOS_NO_PHONE] org has no phone number configured — deliveryId=${deliveryId}`);
  }

  return NextResponse.json({
    ok:       true,
    smsSent,
    orgPhone: orgPhone ?? null,
    ...(smsError ? { smsError } : {}),
  });
}
