import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/* ────────────────────────────────────────────────────────────────────────────
 * AzamPay payment callback.
 *
 * IMPORTANT — AzamPay does NOT cryptographically sign its callbacks. There is no
 * shared "webhook secret", no HMAC and no `x-azampay-signature` header (confirmed
 * against AzamPay's own SDKs). So we cannot verify authenticity by signature.
 *
 * Instead we defend the endpoint with three real, independent layers:
 *
 *   1. URL secret token  — the callback URL registered with AzamPay carries a
 *      long random token (`?token=…`). Requests without the exact token are
 *      rejected, so random internet traffic can never reach the handler.
 *      (Weaker than HMAC: the token is static and rides inside the URL over TLS,
 *      so it could leak via logs. It is defence-in-depth, not the whole story.)
 *
 *   2. Amount check      — we only ever mark a payment PAID for the exact amount
 *      we originally initiated. A forged or tampered callback claiming a
 *      different amount is refused.
 *
 *   3. Idempotency       — a payment that is already PAID is never re-processed.
 *
 * Future hardening (not yet implemented — pending confirmation from AzamPay that
 * their transaction-status endpoint supports MNO *collections*, not only
 * disbursements): re-query the transaction status server-to-server using our
 * Client ID/Secret before marking PAID, instead of trusting the callback body.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Constant-time comparison that never short-circuits on length. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep timing uniform, then fail.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Verify the shared URL token. Required in production; optional in dev. */
function hasValidToken(req: Request): boolean {
  const expected = process.env.AZAMPAY_WEBHOOK_TOKEN;

  if (!expected) {
    // No token configured: allow only outside production so local testing works.
    // In production a missing token is a misconfiguration — fail closed.
    return process.env.NODE_ENV !== "production";
  }

  const url      = new URL(req.url);
  const provided =
    url.searchParams.get("token") ??
    req.headers.get("x-webhook-token") ??
    "";

  return provided.length > 0 && safeEqual(provided, expected);
}

/** Best-effort numeric parse for amounts that may arrive as string or number. */
function toAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function POST(req: Request) {
  /* ── Layer 1: URL token ────────────────────────────────────────────────── */
  if (!hasValidToken(req)) {
    console.warn("[AzamPay Webhook] Rejected callback with missing/invalid token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  /* AzamPay MNO callback fields (per their docs):
       utilityref       → OUR externalId (== payment.reference)
       reference        → AzamPay's own transaction id
       transactionstatus→ "success" | "failure"
       amount           → charged amount
       message          → human-readable status
       operator         → Tigo | Airtel | Mpesa | …
       msisdn           → payer phone (masked storage not required here)        */
  const externalId =
    (body.utilityref as string | undefined) ??
    (body.externalId as string | undefined);

  const azampayTxId =
    (body.reference as string | undefined) ??
    (body.transactionId as string | undefined) ??
    null;

  const rawStatus = body.transactionstatus ?? body.status ?? body.success;
  const message   = body.message as string | undefined;
  const callbackAmount = toAmount(body.amount);

  if (!externalId) {
    console.warn("[AzamPay Webhook] Missing utilityref/externalId in payload");
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const isSuccess =
    rawStatus === true ||
    (typeof rawStatus === "string" &&
      ["success", "true", "successful", "completed"].includes(rawStatus.trim().toLowerCase()));

  const payment = await prisma.payment.findUnique({
    where:  { reference: externalId },
    select: { id: true, status: true, deliveryId: true, amount: true },
  });

  if (!payment) {
    // Unknown reference — likely a callback for another account. Return 200 so
    // the provider stops retrying, but change nothing.
    console.warn(`[AzamPay Webhook] No payment for externalId=${externalId}`);
    return NextResponse.json({ ok: true });
  }

  /* ── Layer 3: idempotency ──────────────────────────────────────────────── */
  if (payment.status === "PAID") {
    return NextResponse.json({ ok: true });
  }

  if (isSuccess) {
    /* ── Layer 2: amount must match what we initiated ────────────────────── */
    const expectedAmount = Number(payment.amount);
    if (callbackAmount !== null && Math.abs(callbackAmount - expectedAmount) >= 0.01) {
      // A success callback for the wrong amount is treated as untrusted.
      console.error(
        `[AzamPay Webhook] AMOUNT MISMATCH externalId=${externalId} ` +
        `expected=${expectedAmount} got=${callbackAmount} — not marking PAID`,
      );
      return NextResponse.json({ error: "Amount mismatch" }, { status: 409 });
    }
    if (callbackAmount === null) {
      // Amount absent from payload: proceed but record that we could not verify.
      console.warn(`[AzamPay Webhook] Callback had no amount to verify externalId=${externalId}`);
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:      "PAID",
        azampayTxId,
        mpesaCode:   (body.mpesaReceiptNumber as string | undefined)
                  ?? (body.fspReferenceId as string | undefined)
                  ?? azampayTxId,
        paidAt:      new Date(),
      },
    });
    console.info(`[AzamPay Webhook] PAID deliveryId=${payment.deliveryId} amount=${expectedAmount}`);
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:        "FAILED",
        failureReason: message ?? "Payment declined by customer or carrier",
      },
    });
    console.warn(`[AzamPay Webhook] FAILED deliveryId=${payment.deliveryId}`);
  }

  return NextResponse.json({ ok: true });
}
