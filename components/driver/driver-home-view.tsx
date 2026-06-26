"use client";

import Link from "next/link";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  IconTruck, IconMapPin, IconPackage, IconChevronRight,
  IconClockHour4, IconRoute, IconCircleCheck, IconBolt, IconCashBanknote,
} from "@tabler/icons-react";
import { TranslatedBanner } from "@/components/layout/translated-banner";
import { useLanguage } from "@/lib/i18n/context";

type DeliverySummary = {
  id: string;
  trackingCode: string;
  status: string;
  priority: string;
  deliveryAddress: string;
  recipientName: string;
  city: string | null;
  driver: { name: string | null } | null;
};

type DriverHomeViewProps = {
  userName: string | null;
  isDriver: boolean;
  initialIsOnline: boolean;
  deliveries: DeliverySummary[];
  completedToday: number;
  cashCollectedToday: number;
  toPickup: number;
  onTheRoad: number;
};

function StatPill({
  icon: Icon, value, label, tint,
}: {
  icon: typeof IconPackage;
  value: number;
  label: string;
  tint: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl bg-white dark:bg-slate-900 p-3.5 ring-1 ring-slate-100 dark:ring-white/10 shadow-sm transition-all h-full">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" stroke={2} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tabular-nums text-slate-800 dark:text-white">{value}</p>
        <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">{label}</p>
      </div>
    </div>
  );
}

export function DriverHomeView({
  userName,
  isDriver,
  initialIsOnline,
  deliveries,
  completedToday,
  cashCollectedToday,
  toPickup,
  onTheRoad,
}: DriverHomeViewProps) {
  const [isOnline, setIsOnline] = useState(initialIsOnline);
  const [toggling, setToggling] = useState(false);

  const toggleStatus = async (checked: boolean) => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch("/api/driver/status", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isOnline: checked }) });
      if (!res.ok) throw new Error();
      setIsOnline(checked);
      toast.success(checked ? "You are now ONLINE" : "You are now OFFLINE");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  const { t, lang } = useLanguage();
  const d = t.driverPortal;
  const s = t.deliveries.statuses;
  const p = t.deliveries.createDialog.priority;

  const STATUS_LABEL: Record<string, { label: string; cls: string; dot: string }> = {
    ASSIGNED:   { label: s.ASSIGNED,   cls: "bg-blue-50   text-blue-700   ring-1 ring-blue-200",   dot: "bg-blue-500"   },
    PICKED_UP:  { label: s.PICKED_UP,  cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200",  dot: "bg-amber-400"  },
    IN_TRANSIT: { label: s.IN_TRANSIT, cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200", dot: "bg-orange-500" },
  };

  const PRIORITY_META: Record<string, { label: string; cls: string }> = {
    URGENT: { label: p.urgent, cls: "bg-red-50 text-red-600 ring-1 ring-red-200" },
    HIGH:   { label: p.high,   cls: "bg-orange-50 text-orange-600 ring-1 ring-orange-200" },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TranslatedBanner
          pageKey="driverPortal"
          image="/banners/driver.jpg"
          dynamicName={userName || undefined}
          alt="Delivery rider on a motorcycle"
        />
        {isDriver && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 shrink-0">
            <span className={`text-sm font-bold tracking-wide uppercase ${isOnline ? "text-emerald-600 dark:text-emerald-500" : "text-slate-400 dark:text-slate-500"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
            <Switch checked={isOnline} onCheckedChange={toggleStatus} disabled={toggling} />
          </div>
        )}
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill icon={IconClockHour4}  value={toPickup}      label={d.toPickup}     tint="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" />
        <StatPill icon={IconRoute}       value={onTheRoad}     label={d.onTheRoad}    tint="bg-orange-50 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400" />
        <StatPill icon={IconCircleCheck} value={completedToday} label={d.doneToday}    tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" />
        <div className="col-span-2 sm:col-span-1 sm:col-start-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl bg-white dark:bg-slate-900 p-3.5 ring-1 ring-slate-100 dark:ring-white/10 shadow-sm transition-all h-full">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400`}>
              <IconCashBanknote className="h-5 w-5" stroke={2} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none tabular-nums text-slate-800 dark:text-white">
                <span className="text-xs mr-0.5 text-slate-400 dark:text-slate-500 font-semibold">TZS</span>
                {cashCollectedToday.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">{lang === "sw" ? "Pesa mkononi" : "Cash collected"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin notice */}
      {!isDriver && deliveries.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <IconTruck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" stroke={2} />
          <p className="text-sm text-blue-700">
            <span className="font-semibold">{d.adminMode}</span> {d.adminModeDesc}
          </p>
        </div>
      )}

      {/* Delivery list */}
      {deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <IconPackage className="h-8 w-8 text-slate-400" stroke={1.5} />
          </div>
          <p className="mb-1 font-semibold text-slate-700">{d.noActive}</p>
          <p className="max-w-xs text-sm text-slate-400">
            {isDriver ? d.noActiveDriverDesc : d.noActiveAdminDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {d.activeDeliveries}
            </p>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-slate-500">
              {deliveries.length}
            </span>
          </div>

          {deliveries.map((delivery) => {
            const status    = STATUS_LABEL[delivery.status];
            const prio = PRIORITY_META[delivery.priority];
            return (
              <Link
                key={delivery.id}
                href={`/dashboard/driver/deliveries/${delivery.id}`}
                className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm transition-all hover:ring-cf-primary/30 hover:shadow-md active:scale-[0.99]"
              >
                {/* Accent bar */}
                <div className={`h-1 ${status?.dot ?? "bg-slate-300"}`} />
                <div className="flex items-stretch gap-3 p-3 sm:gap-3.5 sm:p-4">
                  {/* Left index/avatar */}
                  <div className="hidden shrink-0 sm:flex sm:h-11 sm:w-11 items-center justify-center self-start rounded-xl bg-cf-primary/10">
                    <IconPackage className="h-5 w-5 text-cf-primary" stroke={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Top row: code + status */}
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-bold text-slate-800">
                        {delivery.trackingCode}
                      </span>
                      {status && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      )}
                      {prio && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${prio.cls}`}>
                          <IconBolt className="h-2.5 w-2.5" stroke={2.5} />
                          {prio.label}
                        </span>
                      )}
                    </div>

                    {/* Recipient */}
                    <p className="truncate text-sm font-semibold text-slate-700">{delivery.recipientName}</p>

                    {/* Address */}
                    <div className="mt-1 flex items-start sm:items-center gap-1.5 sm:gap-1">
                      <IconMapPin className="mt-0.5 sm:mt-0 h-3.5 w-3.5 shrink-0 text-slate-400" stroke={1.8} />
                      <p className="text-xs text-slate-400 line-clamp-2 sm:line-clamp-1 sm:truncate">
                        {delivery.deliveryAddress}{delivery.city ? `, ${delivery.city}` : ""}
                      </p>
                    </div>

                    {!isDriver && delivery.driver?.name && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <IconTruck className="h-3 w-3" stroke={1.5} />
                        {delivery.driver.name}
                      </p>
                    )}
                  </div>

                  {/* Chevron */}
                  <div className="flex shrink-0 items-center">
                    <IconChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-cf-primary" stroke={2} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
