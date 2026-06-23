import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const MAX_STREAM_DURATION_MS = 2 * 60 * 1000;

export async function GET(req: Request, { params }: { params: Promise<{ deliveryId: string }> }) {
  const { deliveryId } = await params;
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId }, select: { id: true, organizationId: true, role: true },
  });
  if (!user?.organizationId) return new Response("Forbidden", { status: 403 });

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      organizationId: user.organizationId,
      ...(user.role === "DRIVER" ? { driverId: user.id } : {}),
    },
    select: { id: true },
  });
  if (!delivery) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();
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
          const loc = await prisma.locationUpdate.findFirst({
            where: { deliveryId: delivery.id }, orderBy: { timestamp: "desc" },
            select: { latitude: true, longitude: true, accuracy: true, timestamp: true },
          });
          const payload = loc
            ? { lat: loc.latitude, lng: loc.longitude, accuracy: loc.accuracy, ts: loc.timestamp }
            : { lat: null };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch { /* keep the stream open through transient database failures */ }
      };

      void push();
      interval = setInterval(() => void push(), 4_000);
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
