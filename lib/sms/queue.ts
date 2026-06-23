import { redis } from "@/lib/redis/client";
import { prisma } from "@/lib/db/prisma";
import { sendSms } from "./africas-talking";

const QUEUE_KEY   = "sms:retry";
const MAX_RETRIES = 3;

type QueueItem = { smsLogId: string; attempt: number };

// Exponential backoff: attempt 1→30s, 2→90s, 3→270s
function backoffMs(attempt: number): number {
  return 30_000 * Math.pow(3, attempt - 1);
}

export async function enqueueRetry(smsLogId: string, attempt: number): Promise<void> {
  if (attempt > MAX_RETRIES) return;
  try {
    const score  = Date.now() + backoffMs(attempt);
    const member = JSON.stringify({ smsLogId, attempt } satisfies QueueItem);
    await redis.zadd(QUEUE_KEY, score, member);
  } catch (e) {
    console.error("[SMS Queue] enqueueRetry error:", e);
  }
}

export async function processRetryQueue(): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed    = 0;

  try {
    const now   = String(Date.now());
    const items = await redis.zrangebyscore(QUEUE_KEY, 0, now);
    if (items.length === 0) return { processed, failed };

    await redis.zremrangebyscore(QUEUE_KEY, 0, now);

    for (const raw of items) {
      const { smsLogId, attempt } = JSON.parse(raw) as QueueItem;

      const log = await prisma.smsLog.findUnique({
        where:  { id: smsLogId },
        select: { id: true, recipient: true, message: true, status: true, retryCount: true },
      });

      // Skip if already succeeded or doesn't exist
      if (!log || log.status === "SENT" || log.status === "DELIVERED") continue;

      const result = await sendSms(log.recipient, log.message);

      if (result.success) {
        await prisma.smsLog.update({
          where: { id: smsLogId },
          data:  { status: "SENT", providerMsgId: result.messageId, sentAt: new Date() },
        });
        processed++;
      } else {
        const nextAttempt = attempt + 1;
        if (nextAttempt > MAX_RETRIES) {
          // EC-05: Permanently failed after max retries
          await prisma.smsLog.update({
            where: { id: smsLogId },
            data:  { status: "FAILED", retryCount: MAX_RETRIES },
          });
        } else {
          await prisma.smsLog.update({
            where: { id: smsLogId },
            data:  { retryCount: nextAttempt },
          });
          await enqueueRetry(smsLogId, nextAttempt);
        }
        failed++;
      }
    }
  } catch (e) {
    console.error("[SMS Queue] processRetryQueue error:", e);
  }

  return { processed, failed };
}
