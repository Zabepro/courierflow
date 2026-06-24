import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { ReportsView } from "@/components/reports/reports-view";


export default async function ReportsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true, organizationId: true },
  });
  if (!user?.organizationId) redirect("/dashboard");
  if (user.role === "DRIVER") redirect("/dashboard/driver");

  const organizationId = user.organizationId;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [counts, total, deliveredRevenue, monthRevenue, driverCount] = await Promise.all([
    prisma.delivery.groupBy({ by: ["status"], where: { organizationId }, _count: true }),
    prisma.delivery.count({ where: { organizationId } }),
    prisma.delivery.aggregate({ where: { organizationId, status: "DELIVERED", fee: { not: null } }, _sum: { fee: true } }),
    prisma.delivery.aggregate({ where: { organizationId, createdAt: { gte: monthStart }, fee: { not: null } }, _sum: { fee: true } }),
    prisma.user.count({ where: { organizationId, role: "DRIVER" } }),
  ]);

  const byStatus  = Object.fromEntries(counts.map((c) => [c.status, c._count as number]));
  const active    = (byStatus.ASSIGNED ?? 0) + (byStatus.PICKED_UP ?? 0) + (byStatus.IN_TRANSIT ?? 0);
  const delivered = byStatus.DELIVERED ?? 0;
  const maxCount  = Math.max(1, ...["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"].map((s) => byStatus[s] ?? 0));

  return (
    <ReportsView
      total={total}
      delivered={delivered}
      active={active}
      monthRevenue={Number(monthRevenue._sum.fee ?? 0)}
      deliveredRevenue={Number(deliveredRevenue._sum.fee ?? 0)}
      driverCount={driverCount}
      byStatus={byStatus}
      maxCount={maxCount}
    />
  );
}
