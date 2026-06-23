import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";
import { tzPhone } from "@/lib/validations/phone";
import { updateOrganizationSchema } from "@/lib/validations/organization";

// ── GET /api/organization ────────────────────────────────────────────────────
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const org = await prisma.organization.findUnique({
    where:  { id: user.organizationId },
    select: {
      id: true, name: true, slug: true, phone: true, address: true,
      city: true, country: true, logo: true, createdAt: true,
      _count: { select: { users: true, deliveries: true } },
    },
  });

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  return NextResponse.json({
    ...org,
    createdAt:     org.createdAt.toISOString(),
    memberCount:   org._count.users,
    deliveryCount: org._count.deliveries,
  });
}

// ── PATCH /api/organization ──────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can update organization settings" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = updateOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, phone, address, city, country } = parsed.data;

  // Phone: empty → clear (null); present → must be a valid TZ number.
  let normalizedPhone: string | null = null;
  if (phone && phone.trim() !== "") {
    const phoneResult = tzPhone.safeParse(phone);
    if (!phoneResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: { phone: ["Phone must be a valid Tanzania number: +255712345678"] } },
        { status: 422 }
      );
    }
    normalizedPhone = phoneResult.data;
  }

  const org = await prisma.organization.update({
    where: { id: user.organizationId },
    data: {
      name,
      phone:   normalizedPhone,
      address: address && address.trim() !== "" ? address.trim() : null,
      city:    city    && city.trim()    !== "" ? city.trim()    : null,
      ...(country ? { country } : {}),
    },
    select: {
      id: true, name: true, slug: true, phone: true, address: true,
      city: true, country: true, logo: true, createdAt: true,
    },
  });

  return NextResponse.json({ ...org, createdAt: org.createdAt.toISOString() });
}
