import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Africa's Talking delivery report statuses
const AT_DELIVERED = new Set(["Success"]);
const AT_FAILED    = new Set(["Failed", "Rejected"]);

/**
 * POST /api/webhooks/at
 * Receives delivery reports from Africa's Talking.
 * Always returns 200 — AT will retry on non-200.
 * Body: application/x-www-form-urlencoded
 *   id=ATXid_xxx&status=Success&phoneNumber=%2B255...
 */
export async function POST(req: NextRequest) {
  let body: URLSearchParams;
  try {
    body = new URLSearchParams(await req.text());
  } catch {
    return new NextResponse(null, { status: 200 });
  }

  const msgId  = body.get("id");
  const status = body.get("status");

  if (!msgId || !status) {
    return new NextResponse(null, { status: 200 });
  }

  const log = await prisma.smsLog.findFirst({
    where:  { providerMsgId: msgId },
    select: { id: true, status: true },
  }).catch(() => null);

  if (!log || log.status === "DELIVERED") {
    return new NextResponse(null, { status: 200 });
  }

  const newStatus =
    AT_DELIVERED.has(status) ? "DELIVERED" :
    AT_FAILED.has(status)    ? "FAILED"    : null;

  if (newStatus) {
    await prisma.smsLog.update({
      where: { id: log.id },
      data:  { status: newStatus },
    }).catch((e) => console.error("[AT Webhook] update error:", e));
  }

  return new NextResponse(null, { status: 200 });
}
