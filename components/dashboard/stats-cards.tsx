"use client";

import { useEffect, useState } from "react";
import { IconPackage, IconTruck, IconClock, IconCurrencyDollar } from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTZS } from "@/lib/utils";

type Stats = {
  total:          number;
  active:         number;
  pending:        number;
  deliveredToday: number;
  revenueMonth:   number;
};

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string;
  value: string | number;
  sub:   string;
  icon:  React.ElementType;
  color: string;
}) {
  return (
    <Card className="flex items-start gap-4 p-5 bg-white shadow-sm border-0 ring-1 ring-slate-100">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" stroke={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 font-heading text-2xl font-bold text-slate-800 tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
      </div>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="flex items-start gap-4 p-5 bg-white shadow-sm border-0 ring-1 ring-slate-100">
          <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function StatsCards() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StatsSkeleton />;
  if (!stats)  return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Deliveries"
        value={stats.total.toLocaleString()}
        sub={`${stats.deliveredToday} delivered today`}
        icon={IconPackage}
        color="bg-cf-primary"
      />
      <StatCard
        label="Active"
        value={stats.active}
        sub="Assigned, picked up, in transit"
        icon={IconTruck}
        color="bg-orange-500"
      />
      <StatCard
        label="Pending Assignment"
        value={stats.pending}
        sub={stats.pending > 0 ? "Need a driver" : "All assigned"}
        icon={IconClock}
        color={stats.pending > 0 ? "bg-amber-500" : "bg-slate-400"}
      />
      <StatCard
        label="Revenue This Month"
        value={formatTZS(String(stats.revenueMonth))}
        sub="Sum of delivery fees"
        icon={IconCurrencyDollar}
        color="bg-green-600"
      />
    </div>
  );
}
