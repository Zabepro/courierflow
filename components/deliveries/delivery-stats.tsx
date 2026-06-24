"use client";

import { useEffect, useState } from "react";
import {
  IconPackage, IconTruckDelivery, IconClockHour4, IconCircleCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

type Stats = {
  total:          number;
  active:         number;
  pending:        number;
  deliveredToday: number;
  revenueMonth:   number;
};

const CARDS = [
  { key: "total",          icon: IconPackage,        tint: "bg-cf-primary/10 text-cf-primary", bar: "bg-cf-primary"  },
  { key: "active",         icon: IconTruckDelivery, tint: "bg-orange-50 text-orange-500",     bar: "bg-orange-400"  },
  { key: "pending",        icon: IconClockHour4,     tint: "bg-amber-50 text-amber-500",       bar: "bg-amber-400"   },
  { key: "deliveredToday", icon: IconCircleCheck,    tint: "bg-emerald-50 text-emerald-600",   bar: "bg-emerald-500" },
] as const;

export function DeliveryStats({ refreshSignal = 0 }: { refreshSignal?: number }) {
  const { t } = useLanguage();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("stats failed");
        const data = (await res.json()) as Stats;
        if (!cancelled) setStats(data);
      } catch {
        /* silent — stats are non-critical */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshSignal]);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARDS.map(({ key, icon: Icon, tint, bar }) => {
        let label = "";
        let hint = "";
        if (key === "total") { label = t.deliveries.stats.total; hint = t.deliveries.stats.allDeliveries; }
        else if (key === "active") { label = t.deliveries.stats.onTheRoad; hint = t.deliveries.stats.assignedInTransit; }
        else if (key === "pending") { label = t.deliveries.stats.pending; hint = t.deliveries.stats.awaitingAssignment; }
        else if (key === "deliveredToday") { label = t.deliveries.stats.deliveredToday; hint = t.deliveries.stats.completedToday; }
        
        return (
          <div
            key={key}
            className="relative overflow-hidden rounded-xl bg-white p-5 ring-1 ring-slate-100 shadow-sm"
          >
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              {loading || !stats ? (
                <div className="mt-2 h-8 w-14 animate-pulse rounded-md bg-slate-100" />
              ) : (
                <p className="mt-1 text-3xl font-bold tabular-nums text-slate-800">
                  {stats[key].toLocaleString()}
                </p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
            </div>
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tint)}>
              <Icon className="h-5 w-5" stroke={2} />
            </div>
          </div>
          <div className={cn("absolute inset-x-0 bottom-0 h-0.5", bar)} />
        </div>
        );
      })}
    </div>
  );
}
