import {
  IconPackage, IconArrowsExchange, IconUserCheck, IconUserPlus, IconTrash, IconActivity,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export type AuditRow = {
  id:         string;
  action:     string;
  actorName:  string | null;
  entityType: string;
  details:    Record<string, unknown> | null;
  createdAt:  string;
};

const META: Record<string, { icon: React.ElementType; tint: string }> = {
  "delivery.created":          { icon: IconPackage,        tint: "bg-cf-primary/10 text-cf-primary" },
  "delivery.status_changed":   { icon: IconArrowsExchange, tint: "bg-blue-50 text-blue-600" },
  "delivery.driver_assigned":  { icon: IconUserCheck,      tint: "bg-orange-50 text-orange-600" },
  "driver.added":              { icon: IconUserPlus,       tint: "bg-emerald-50 text-emerald-600" },
  "organization.reset":        { icon: IconTrash,          tint: "bg-red-50 text-red-600" },
};

function describe(row: AuditRow): string {
  const d = row.details ?? {};
  switch (row.action) {
    case "delivery.created":         return `Created delivery ${d.trackingCode ?? ""}`.trim();
    case "delivery.status_changed":  return `${d.trackingCode ?? "Delivery"}: ${String(d.from ?? "").replace("_", " ")} → ${String(d.to ?? "").replace("_", " ")}`;
    case "delivery.driver_assigned": return `Assigned ${d.driverName ?? "a driver"} to ${d.trackingCode ?? "a delivery"}`;
    case "driver.added":             return `Added driver ${d.name ?? ""}`.trim();
    case "organization.reset":       return `Reset all data — ${d.deliveries ?? 0} deliveries, ${d.drivers ?? 0} drivers removed`;
    default:                         return row.action;
  }
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function ActivityLog({ logs }: { logs: AuditRow[] }) {
  return (
    <Card className="bg-white border-0 ring-1 ring-slate-100 shadow-sm overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-cf-primary via-cf-primary/50 to-transparent" />
      <CardHeader className="pb-5 border-b border-slate-100">
        <CardTitle className="font-heading text-base font-semibold text-slate-800 flex items-center gap-2">
          <IconActivity className="h-4 w-4 text-cf-primary" stroke={2} />
          Recent Activity
        </CardTitle>
        <CardDescription className="text-sm mt-1">
          An audit trail of key actions in your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {logs.map((row) => {
            const meta = META[row.action] ?? { icon: IconActivity, tint: "bg-slate-100 text-slate-500" };
            const Icon = meta.icon;
            return (
              <div key={row.id} className="flex items-center gap-3.5 px-6 py-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}>
                  <Icon className="h-4 w-4" stroke={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{describe(row)}</p>
                  <p className="truncate text-xs text-slate-400 mt-0.5">{row.actorName ?? "Admin"}</p>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-slate-400 tabular-nums">{timeAgo(row.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
