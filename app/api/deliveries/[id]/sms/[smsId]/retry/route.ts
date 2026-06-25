import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { sendSms } from "@/lib/sms/africas-talking";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; smsId: string }> }
) {
  const { id, smsId } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;

  if (user.role === "VIEWER") {
    return NextResponse.json({ error: "Viewers cannot retry SMS" }, { status: 403 });
  }

  const smsLog = await prisma.smsLog.findUnique({
    where: { id: smsId, deliveryId: id, organizationId: user.organizationId },
  });

  if (!smsLog) {
    return NextResponse.json({ error: "SMS log not found" }, { status: 404 });
  }

  // Update status to pending
  await prisma.smsLog.update({
    where: { id: smsId },
    data: { status: "PENDING", retryCount: smsLog.retryCount + 1 },
  });

  // Attempt send immediately
  const result = await sendSms(smsLog.recipient, smsLog.message);

  if (result.success) {
    const updated = await prisma.smsLog.update({
      where: { id: smsId },
      data: { status: "SENT", providerMsgId: result.messageId, sentAt: new Date(), cost: result.cost },
    });
    return NextResponse.json({
      data: { ...updated, cost: updated.cost?.toString() ?? null },
    });
  }

  // Failed
  const updated = await prisma.smsLog.update({
    where: { id: smsId },
    data: { status: "FAILED" },
  });

  return NextResponse.json(
    { error: result.error, data: { ...updated, cost: updated.cost?.toString() ?? null } },
    { status: 502 }
  );
}
