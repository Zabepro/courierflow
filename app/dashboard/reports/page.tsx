import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { PageBanner } from "@/components/layout/page-banner";
import { formatTZS } from "@/lib/utils";
import {
  IconPackage, IconTruckDelivery, IconCircleCheck, IconCash, IconDownload,
} from "@tabler/icons-react";

const STATUS_META: Record<string, { label: string; bar: string }> = {
  PENDING:    { label: "Pending",    bar: "bg-slate-400" },
  ASSIGNED:   { label: "Assigned",   bar: "bg-blue-500" },
  PICKED_UP:  { label: "Picked Up",  bar: "bg-amber-400" },
  IN_TRANSIT: { label: "In Transit", bar: "bg-orange-500" },
  DELIVERED:  { label: "Delivered",  bar: "bg-green-500" },
  FAILED:     { label: "Failed",     bar: "bg-red-500" },
  CANCELLED:  { label: "Cancelled",  bar: "bg-slate-300" },
};
const STATUS_ORDER = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"];

function Kpi({ icon: Icon, label, value, tint }: { icon: typeof IconPackage; label: string; value: string; tint: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800 sm:text-3xl">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
          <Icon className="h-5 w-5" stroke={2} />
        </div>
      </div>
    </div>
  );
}

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
  const maxCount  = Math.max(1, ...STATUS_ORDER.map((s) => byStatus[s] ?? 0));

  return (
    <div className="space-y-6">
      <PageBanner
        image="/banners/overview.jpg"
        title="Reports"
        subtitle="Delivery performance, revenue and exports for your organisation"
        alt="Logistics operations overview"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={IconPackage}        label="Total deliveries" value={total.toLocaleString()}                          tint="bg-cf-primary/10 text-cf-primary" />
        <Kpi icon={IconCircleCheck}    label="Delivered"        value={delivered.toLocaleString()}                      tint="bg-emerald-50 text-emerald-600" />
        <Kpi icon={IconTruckDelivery}  label="Active"           value={active.toLocaleString()}                         tint="bg-orange-50 text-orange-500" />
        <Kpi icon={IconCash}           label="Revenue (month)"  value={formatTZS(Number(monthRevenue._sum.fee ?? 0))}           tint="bg-green-50 text-green-600" />
      </div>

      {/* Status breakdown */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-slate-100 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-slate-800">Deliveries by status</h2>
            <p className="text-xs text-slate-400">Realised revenue (delivered): {formatTZS(Number(deliveredRevenue._sum.fee ?? 0))} · {driverCount} drivers</p>
          </div>
        </div>
        <div className="space-y-3">
          {STATUS_ORDER.map((s) => {
            const n   = byStatus[s] ?? 0;
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            const meta = STATUS_META[s];
            return (
              <div key={s} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-semibold text-slate-500">{meta.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${(n / maxCount) * 100}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-600">
                  {n.toLocaleString()} <span className="text-slate-400">· {pct}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl bg-white p-5 ring-1 ring-slate-100 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div>
          <h2 className="font-heading text-base font-bold text-slate-800">Export deliveries</h2>
          <p className="text-xs text-slate-400">Download all deliveries as a CSV (opens in Excel / Google Sheets).</p>
        </div>
        <a
          href="/api/deliveries/export"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-cf-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cf-primary/90"
        >
          <IconDownload className="h-4 w-4" stroke={2} />
          Download CSV
        </a>
      </div>
    </div>
  );
}
