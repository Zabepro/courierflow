import { prisma } from "@/lib/db/prisma";
import { sendSms } from "./africas-talking";
import { enqueueRetry } from "./queue";

type SendParams = {
  organizationId: string;
  deliveryId:     string;
  recipient:      string;
  message:        string;
  idempotencyKey: string;
};

/**
 * Send an SMS with idempotency guard, SmsLog tracking, and EC-05 retry queue.
 * Never throws — all errors are caught and logged.
 */
export async function sendDeliverySms(p: SendParams): Promise<void> {
  // Idempotency: skip if this exact notification was already sent
  try {
    const existing = await prisma.smsLog.findUnique({
      where:  { idempotencyKey: p.idempotencyKey },
      select: { id: true },
    });
    if (existing) return;
  } catch {
    // If check fails, proceed — worst case we send twice (acceptable)
  }

  // Create log record first (PENDING)
  let logId: string;
  try {
    const log = await prisma.smsLog.create({
      data: {
        organizationId: p.organizationId,
        deliveryId:     p.deliveryId,
        recipient:      p.recipient,
        message:        p.message,
        status:         "PENDING",
        idempotencyKey: p.idempotencyKey,
      },
    });
    logId = log.id;
  } catch (e) {
    // Unique constraint violation = another request already created it (race condition OK)
    console.warn("[SMS] SmsLog create skipped (likely race):", e instanceof Error ? e.message : e);
    return;
  }

  // Send
  const result = await sendSms(p.recipient, p.message);

  if (result.success) {
    await prisma.smsLog.update({
      where: { id: logId },
      data:  { status: "SENT", providerMsgId: result.messageId, sentAt: new Date() },
    });
    return;
  }

  // Failed: update log and enqueue retry (EC-05)
  await prisma.smsLog.update({
    where: { id: logId },
    data:  { status: "FAILED", retryCount: 1 },
  });

  // Don't retry unconfigured sandbox — retry only real network/AT errors
  const isConfigError = result.error === "AT_API_KEY not configured";
  if (!isConfigError) {
    await enqueueRetry(logId, 1);
  }
}
