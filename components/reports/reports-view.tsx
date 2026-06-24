"use client";

import { TranslatedBanner } from "@/components/layout/translated-banner";
import { formatTZS } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";
import {
  IconPackage, IconTruckDelivery, IconCircleCheck, IconCash, IconDownload,
} from "@tabler/icons-react";

type ReportsViewProps = {
  total: number;
  delivered: number;
  active: number;
  monthRevenue: number;
  deliveredRevenue: number;
  driverCount: number;
  byStatus: Record<string, number>;
  maxCount: number;
};

const STATUS_ORDER = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"];

const STATUS_BARS: Record<string, string> = {
  PENDING:    "bg-slate-400",
  ASSIGNED:   "bg-blue-500",
  PICKED_UP:  "bg-amber-400",
  IN_TRANSIT: "bg-orange-500",
  DELIVERED:  "bg-green-500",
  FAILED:     "bg-red-500",
  CANCELLED:  "bg-slate-300",
};

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

export function ReportsView({
  total,
  delivered,
  active,
  monthRevenue,
  deliveredRevenue,
  driverCount,
  byStatus,
  maxCount,
}: ReportsViewProps) {
  const { t } = useLanguage();
  const r = t.reports;
  const s = t.deliveries.statuses;

  const STATUS_LABELS: Record<string, string> = {
    PENDING:    s.PENDING,
    ASSIGNED:   s.ASSIGNED,
    PICKED_UP:  s.PICKED_UP,
    IN_TRANSIT: s.IN_TRANSIT,
    DELIVERED:  s.DELIVERED,
    FAILED:     s.FAILED,
    CANCELLED:  s.CANCELLED,
  };

  return (
    <div className="space-y-6">
      <TranslatedBanner
        pageKey="reports"
        image="/banners/overview.jpg"
        alt="Logistics operations overview"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={IconPackage}        label={r.totalDeliveries} value={total.toLocaleString()}                          tint="bg-cf-primary/10 text-cf-primary" />
        <Kpi icon={IconCircleCheck}    label={r.delivered}       value={delivered.toLocaleString()}                      tint="bg-emerald-50 text-emerald-600" />
        <Kpi icon={IconTruckDelivery}  label={r.active}          value={active.toLocaleString()}                         tint="bg-orange-50 text-orange-500" />
        <Kpi icon={IconCash}           label={r.revenueMonth}    value={formatTZS(monthRevenue)}                         tint="bg-green-50 text-green-600" />
      </div>

      {/* Status breakdown */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-slate-100 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-slate-800">{r.byStatus}</h2>
            <p className="text-xs text-slate-400">{r.realisedRevenue}: {formatTZS(deliveredRevenue)} · {driverCount} {r.drivers}</p>
          </div>
        </div>
        <div className="space-y-3">
          {STATUS_ORDER.map((statusKey) => {
            const n   = byStatus[statusKey] ?? 0;
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            const label = STATUS_LABELS[statusKey];
            const bar = STATUS_BARS[statusKey];
            return (
              <div key={statusKey} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-semibold text-slate-500">{label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${(n / maxCount) * 100}%` }} />
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
          <h2 className="font-heading text-base font-bold text-slate-800">{r.export}</h2>
          <p className="text-xs text-slate-400">{r.exportDesc}</p>
        </div>
        <a
          href="/api/deliveries/export"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-cf-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cf-primary/90"
        >
          <IconDownload className="h-4 w-4" stroke={2} />
          {r.downloadCsv}
        </a>
      </div>
    </div>
  );
}
