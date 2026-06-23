import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const MAX_CONNECTIONS_PER_MINUTE = 10;
const MAX_STREAM_DURATION_MS = 2 * 60 * 1000;

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const rateLimit = await checkRateLimit(
    `rate:track-stream:${getClientIp(req)}`,
    MAX_CONNECTIONS_PER_MINUTE,
    60
  );
  if (rateLimit.unavailable) return new Response("Tracking is temporarily unavailable", { status: 503 });
  if (!rateLimit.allowed) return new Response("Too many requests", { status: 429 });

  const encoder = new TextEncoder();
  const delivery = await prisma.delivery.findUnique({
    where: { trackingCode: code.toUpperCase() },
    select: { id: true },
  });

  if (!delivery) {
    return new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ found: false })}\n\n`));
        controller.close();
      },
    }), { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  }

  let closed = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const close = (controller: ReadableStreamDefaultController) => {
    if (closed) return;
    closed = true;
    if (interval) clearInterval(interval);
    if (timeout) clearTimeout(timeout);
    try { controller.close(); } catch { /* stream was already closed */ }
  };

  const stream = new ReadableStream({
    start(controller) {
      const push = async () => {
        if (closed) return;
        try {
          const current = await prisma.delivery.findUnique({
            where: { id: delivery.id },
            select: { status: true },
          });
          const isActive = ["PICKED_UP", "IN_TRANSIT"].includes(current?.status ?? "");
          if (!isActive) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ found: true, active: false, status: current?.status })}\n\n`));
            return;
          }
          const loc = await prisma.locationUpdate.findFirst({
            where: { deliveryId: delivery.id }, orderBy: { timestamp: "desc" },
            select: { latitude: true, longitude: true, accuracy: true, timestamp: true },
          });
          const payload = loc
            ? { found: true, active: true, lat: loc.latitude, lng: loc.longitude, accuracy: loc.accuracy, ts: loc.timestamp }
            : { found: true, active: true, lat: null };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch { /* keep the stream open through transient database failures */ }
      };

      void push();
      interval = setInterval(() => void push(), 5_000);
      timeout = setTimeout(() => close(controller), MAX_STREAM_DURATION_MS);
      req.signal.addEventListener("abort", () => close(controller), { once: true });
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
