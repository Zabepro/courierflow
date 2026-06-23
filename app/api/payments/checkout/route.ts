import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { mnoCheckout } from "@/lib/azampay/client";
import type { PaymentMethod } from "@/lib/generated/prisma/client";

const schema = z.object({
  deliveryId:  z.string().min(1),
  phoneNumber: z.string().min(9).max(15).regex(/^[\d+]+$/, "Invalid phone number"),
  method:      z.enum(["TIGOPESA", "AIRTEL_MONEY", "MPESA"]),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where:  { clerkId: userId },
      select: { id: true, role: true, organizationId: true },
    });
    if (!user?.organizationId || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Throttle payment initiation per user — protects the MNO gateway from abuse.
    const limited = await enforceRateLimit(`rate:payment:${user.id}`, 20, 60);
    if (limited) return limited;

    const body   = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { deliveryId, phoneNumber, method } = parsed.data;

    /* Fetch delivery with fee — must belong to this org */
    const delivery = await prisma.delivery.findFirst({
      where:  { id: deliveryId, organizationId: user.organizationId },
      select: { id: true, fee: true, status: true, payment: { select: { id: true, status: true } } },
    });
    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }
    if (!delivery.fee || Number(delivery.fee) <= 0) {
      return NextResponse.json({ error: "Delivery has no fee set" }, { status: 422 });
    }
    if (delivery.payment?.status === "PAID") {
      return NextResponse.json({ error: "Delivery is already paid" }, { status: 409 });
    }
    if (delivery.payment?.status === "PENDING") {
      return NextResponse.json({ error: "A payment request is already in progress" }, { status: 409 });
    }

    const amount     = Number(delivery.fee);
    const externalId = randomUUID();

    /* Claim the payment attempt before calling the gateway. Conditional writes
       make concurrent checkout requests resolve to one pending attempt. */
    let payment: { id: string };
    try {
      if (delivery.payment) {
        const claimed = await prisma.payment.updateMany({
          where: { id: delivery.payment.id, status: "FAILED" },
          data: {
            method: method as PaymentMethod,
            status: "PENDING",
            phoneNumber,
            reference: externalId,
            azampayTxId: null,
            mpesaCode: null,
            failureReason: null,
            paidAt: null,
          },
        });
        if (claimed.count !== 1) {
          return NextResponse.json({ error: "A payment request is already in progress" }, { status: 409 });
        }
        payment = { id: delivery.payment.id };
      } else {
        payment = await prisma.payment.create({
          data: {
            deliveryId,
            organizationId: user.organizationId,
            amount,
            currency: "TZS",
            method: method as PaymentMethod,
            status: "PENDING",
            phoneNumber,
            reference: externalId,
          },
          select: { id: true },
        });
      }
    } catch (dbErr) {
      const code = (dbErr as { code?: string }).code;
      if (code === "P2002") {
        return NextResponse.json({ error: "A payment request is already in progress" }, { status: 409 });
      }
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error("[PAYMENT] DB upsert error:", msg);
      return NextResponse.json({ error: "Could not prepare the payment request" }, { status: 500 });
    }

    /* Call AzamPay MNO checkout */
    let result: Awaited<ReturnType<typeof mnoCheckout>>;
    try {
      result = await mnoCheckout({ phone: phoneNumber, amount, method: method as PaymentMethod, externalId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[PAYMENT] AzamPay error:", msg);
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { status: "FAILED", failureReason: msg },
      });
      return NextResponse.json({ error: "Payment provider is temporarily unavailable" }, { status: 502 });
    }

    if (result.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { azampayTxId: result.transactionId },
      });
      console.info(`[PAYMENT] Checkout initiated deliveryId=${deliveryId} method=${method}`);
      return NextResponse.json({
        ok:          true,
        paymentId:   payment.id,
        azampayTxId: result.transactionId,
        message:     "Payment request sent — customer will receive USSD prompt to confirm",
      });
    }

    /* AzamPay returned success=false */
    await prisma.payment.update({
      where: { id: payment.id },
      data:  { status: "FAILED", failureReason: result.message },
    });
    console.warn("[PAYMENT] Provider rejected checkout:", result.message);
    return NextResponse.json({ error: "Payment request was not accepted" }, { status: 502 });

  } catch (unexpected) {
    const msg = unexpected instanceof Error ? unexpected.message : String(unexpected);
    console.error("[PAYMENT] Unexpected error:", msg, unexpected);
    return NextResponse.json({ error: "Could not process the payment request" }, { status: 500 });
  }
}
