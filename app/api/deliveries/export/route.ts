import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/** Quote a CSV cell, escaping quotes/commas/newlines per RFC 4180. */
function csv(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const HEADERS = [
  "Tracking", "Status", "Priority", "Recipient", "Recipient Phone",
  "Sender", "Sender Phone", "Pickup", "Delivery", "City",
  "Driver", "Fee (TZS)", "Payment", "Created", "Delivered",
];

/**
 * GET /api/deliveries/export — download all of the org's deliveries as a CSV.
 * ADMIN / VIEWER only (operational export, not for drivers).
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true, organizationId: true },
  });
  if (!user?.organizationId || user.role === "DRIVER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deliveries = await prisma.delivery.findMany({
    where:   { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      driver:  { select: { name: true } },
      payment: { select: { status: true } },
    },
  });

  const rows = deliveries.map((d) => [
    d.trackingCode, d.status, d.priority,
    d.recipientName, d.recipientPhone,
    d.senderName, d.senderPhone,
    d.pickupAddress, d.deliveryAddress, d.city ?? "",
    d.driver?.name ?? "", d.fee?.toString() ?? "",
    d.payment?.status ?? "UNPAID",
    d.createdAt.toISOString().slice(0, 19).replace("T", " "),
    d.deliveredAt ? d.deliveredAt.toISOString().slice(0, 19).replace("T", " ") : "",
  ].map(csv).join(","));

  /* BOM so Excel opens UTF-8 (Swahili/accents) correctly */
  const body = "﻿" + [HEADERS.join(","), ...rows].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="courierflow-deliveries-${date}.csv"`,
      "Cache-Control":       "no-store",
    },
  });
}
