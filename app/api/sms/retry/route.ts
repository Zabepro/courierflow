import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { processRetryQueue } from "@/lib/sms/queue";

/**
 * POST /api/sms/retry
 * Processes the SMS retry queue (call from a cron job).
 * Protected by CRON_SECRET env var when set.
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[SMS Retry] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Retry service is not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  const expected = `Bearer ${cronSecret}`;
  const isAuthorized =
    auth !== null &&
    auth.length === expected.length &&
    timingSafeEqual(Buffer.from(auth), Buffer.from(expected));

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processRetryQueue();
  return NextResponse.json({ ok: true, ...result });
}
