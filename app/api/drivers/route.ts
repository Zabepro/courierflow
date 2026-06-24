import { NextRequest, NextResponse } from "next/server";
import { randomUUID, randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createDriverSchema } from "@/lib/validations/driver";
import { sendSms } from "@/lib/sms/africas-talking";

const ACTIVE_STATUSES = new Set(["ASSIGNED", "PICKED_UP", "IN_TRANSIT"]);

// ── GET /api/drivers ─────────────────────────────────────────────────────────
// Returns every driver in the caller's organization with delivery stats.
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const drivers = await prisma.user.findMany({
    where:  { organizationId: user.organizationId, role: "DRIVER" },
    select: { id: true, name: true, phone: true, email: true, clerkId: true, inviteToken: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  if (drivers.length === 0) return NextResponse.json([]);

  // One grouped query gives active/completed/total counts for all drivers at once.
  const grouped = await prisma.delivery.groupBy({
    by:     ["driverId", "status"],
    where:  { organizationId: user.organizationId, driverId: { in: drivers.map((d) => d.id) } },
    _count: true,
  });

  const stats = new Map<string, { active: number; completed: number; total: number }>();
  for (const g of grouped) {
    if (!g.driverId) continue;
    const s = stats.get(g.driverId) ?? { active: 0, completed: 0, total: 0 };
    s.total += g._count;
    if (ACTIVE_STATUSES.has(g.status)) s.active += g._count;
    if (g.status === "DELIVERED")      s.completed += g._count;
    stats.set(g.driverId, s);
  }

  return NextResponse.json(
    drivers.map((d) => {
      const s = stats.get(d.id) ?? { active: 0, completed: 0, total: 0 };
      // A driver added by an admin hasn't signed in via Clerk yet.
      const pending = d.clerkId.startsWith("pending_");
      return {
        id:                  d.id,
        name:                d.name,
        phone:               d.phone,
        email:               d.email,
        activeDeliveries:    s.active,      // kept for the assign-driver dialog
        completedDeliveries: s.completed,
        totalDeliveries:     s.total,
        pending,
        inviteLink:          pending && d.inviteToken ? `${appUrl}/invite/${d.inviteToken}` : null,
        createdAt:           d.createdAt.toISOString(),
      };
    })
  );
}

// ── POST /api/drivers ────────────────────────────────────────────────────────
// Admin pre-registers a driver. The Clerk webhook links the real identity by
// email when the driver later signs in (see /api/webhooks/clerk).
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can add drivers" }, { status: 403 });
  }

  const limited = await enforceRateLimit(`rate:drivers:create:${user.id}`, 30, 60);
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = createDriverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, phone, email } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const inviteToken = randomBytes(24).toString("hex");

  try {
    const driver = await prisma.user.create({
      data: {
        clerkId:        `pending_${randomUUID()}`, // replaced when the driver accepts the invite
        email,
        name,
        phone,
        role:           "DRIVER",
        organizationId: user.organizationId,
        inviteToken,
      },
      select: { id: true, name: true, phone: true, email: true, createdAt: true },
    });

    /* Build the invite link and SMS it to the driver (best-effort). The driver
       opens it, signs up with ANY email, and the token links them — no need to
       match a pre-set email, so "email already taken" never blocks them. */
    const appUrl     = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const inviteLink = `${appUrl}/invite/${inviteToken}`;

    if (phone) {
      const org = await prisma.organization.findUnique({
        where:  { id: user.organizationId },
        select: { name: true },
      });
      const msg =
        `CourierFlow: Umealikwa kuwa dereva${org?.name ? ` wa ${org.name}` : ""}. ` +
        `Fungua hii kujiunga: ${inviteLink}`;
      void sendSms(phone, msg).catch(() => {});
    }

    return NextResponse.json(
      {
        id:                  driver.id,
        name:                driver.name,
        phone:               driver.phone,
        email:               driver.email,
        activeDeliveries:    0,
        completedDeliveries: 0,
        totalDeliveries:     0,
        pending:             true,
        inviteLink,
        createdAt:           driver.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    console.error("[drivers] create error:", e);
    return NextResponse.json({ error: "Could not add the driver" }, { status: 500 });
  }
}
