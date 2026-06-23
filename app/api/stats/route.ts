import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const orgId = user.organizationId;
  const now   = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [counts, revenueAgg] = await Promise.all([
    prisma.delivery.groupBy({
      by:    ["status"],
      where: { organizationId: orgId },
      _count: true,
    }),
    prisma.delivery.aggregate({
      where:  { organizationId: orgId, createdAt: { gte: monthStart }, fee: { not: null } },
      _sum:   { fee: true },
    }),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  const total         = counts.reduce((s, c) => s + c._count, 0);
  const active        = (byStatus.ASSIGNED ?? 0) + (byStatus.PICKED_UP ?? 0) + (byStatus.IN_TRANSIT ?? 0);
  const pending       = byStatus.PENDING ?? 0;
  const deliveredToday = await prisma.delivery.count({
    where: { organizationId: orgId, status: "DELIVERED", deliveredAt: { gte: todayStart } },
  });

  const revenueMonth = Number(revenueAgg._sum.fee ?? 0);

  return NextResponse.json({ total, active, pending, deliveredToday, revenueMonth });
}
