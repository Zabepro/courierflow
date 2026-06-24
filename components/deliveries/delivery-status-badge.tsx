import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";
import type { DeliveryStatus } from "@/lib/generated/prisma/client";

const config: Record<DeliveryStatus, { dot: string; cls: string }> = {
  PENDING:    { dot: "bg-slate-400",  cls: "bg-slate-50 text-slate-600 ring-1 ring-slate-200" },
  ASSIGNED:   { dot: "bg-blue-500",   cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  PICKED_UP:  { dot: "bg-amber-400",  cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  IN_TRANSIT: { dot: "bg-orange-500", cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200" },
  DELIVERED:  { dot: "bg-green-500",  cls: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  FAILED:     { dot: "bg-red-500",    cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
  CANCELLED:  { dot: "bg-slate-300",  cls: "bg-slate-50 text-slate-400 ring-1 ring-slate-200" },
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const { t } = useLanguage();
  const c = config[status] ?? config.PENDING;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap",
      c.cls,
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {t.deliveries.statuses[status] || status}
    </span>
  );
}
