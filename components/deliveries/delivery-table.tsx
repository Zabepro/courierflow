"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  IconUserPlus, IconCopy, IconCheck, IconEye,
  IconCircleCheck, IconClockHour4, IconCircleX,
} from "@tabler/icons-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeliveryStatusBadge } from "./delivery-status-badge";
import { AssignDriverDialog }   from "./assign-driver-dialog";
import { DeliveryDetailSheet }  from "./delivery-detail-sheet";
import { formatTZS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";
import type { ApiDelivery } from "./types";

const TERMINAL = new Set(["DELIVERED", "FAILED", "CANCELLED"]);

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH:   "bg-orange-400",
};

const PAYMENT_META = {
  PAID:    { icon: IconCircleCheck, label: "Paid",    cls: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  PENDING: { icon: IconClockHour4,  label: "Pending", cls: "bg-amber-50 text-amber-600 ring-1 ring-amber-200" },
  FAILED:  { icon: IconCircleX,     label: "Failed",  cls: "bg-red-50 text-red-600 ring-1 ring-red-200" },
} as const;

interface Props {
  deliveries:        ApiDelivery[];
  onDeliveryUpdated: (d: ApiDelivery) => void;
}

export function DeliveryTable({ deliveries, onDeliveryUpdated }: Props) {
  const { t } = useLanguage();
  const [assignTarget, setAssignTarget] = useState<ApiDelivery | null>(null);
  const [detailTarget, setDetailTarget] = useState<ApiDelivery | null>(null);
  const [copiedId,     setCopiedId]     = useState<string | null>(null);

  function copyLink(e: React.MouseEvent, d: ApiDelivery) {
    e.stopPropagation();
    const url = `${window.location.origin}/track/${d.trackingCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(d.id);
      toast.success(t.table.linkCopied);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-100 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50 border-b border-slate-100">
              <TableHead className="pl-5 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-500">{t.table.tracking}</TableHead>
              <TableHead className="py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-500">{t.table.recipient}</TableHead>
              <TableHead className="py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-500 hidden md:table-cell">{t.table.address}</TableHead>
              <TableHead className="py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-500">{t.table.status}</TableHead>
              <TableHead className="py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-500 hidden lg:table-cell">{t.table.driver}</TableHead>
              <TableHead className="py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-500 hidden lg:table-cell">{t.table.fee}</TableHead>
              <TableHead className="py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-500 hidden xl:table-cell">{t.table.date}</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {deliveries.map((d) => (
              <TableRow
                key={d.id}
                className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/70 transition-colors group"
                onClick={() => setDetailTarget(d)}
              >
                {/* Tracking code + priority dot */}
                <TableCell className="pl-5 py-4">
                  <div className="flex items-center gap-2">
                    {PRIORITY_DOT[d.priority] && (
                      <span
                        className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT[d.priority])}
                        title={d.priority}
                      />
                    )}
                    <span className="font-mono text-sm font-semibold text-cf-primary">
                      {d.trackingCode}
                    </span>
                  </div>
                </TableCell>

                {/* Recipient */}
                <TableCell className="py-4">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{d.recipientName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{d.recipientPhone}</p>
                </TableCell>

                {/* Address */}
                <TableCell className="py-4 hidden md:table-cell">
                  <p className="max-w-[180px] truncate text-sm text-slate-600">{d.deliveryAddress}</p>
                  {d.city && <p className="text-xs text-slate-400 mt-0.5">{d.city}</p>}
                </TableCell>

                {/* Status */}
                <TableCell className="py-4">
                  <DeliveryStatusBadge status={d.status} />
                </TableCell>

                {/* Driver */}
                <TableCell className="py-4 text-sm text-slate-600 hidden lg:table-cell">
                  {d.driver?.name ?? <span className="text-slate-300">—</span>}
                </TableCell>

                {/* Fee + payment badge */}
                <TableCell className="py-4 hidden lg:table-cell">
                  {d.fee ? (
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-slate-700">{formatTZS(d.fee)}</p>
                      {d.payment && (() => {
                        const pm = PAYMENT_META[d.payment.status as keyof typeof PAYMENT_META];
                        if (!pm) return null;
                        const PIcon = pm.icon;
                        return (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            pm.cls,
                          )}>
                            <PIcon className="h-3 w-3" stroke={2} />
                            {pm.label}
                          </span>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </TableCell>

                {/* Date */}
                <TableCell className="py-4 text-xs text-slate-400 whitespace-nowrap hidden xl:table-cell">
                  {new Date(d.createdAt).toLocaleDateString("en-TZ", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </TableCell>

                {/* Actions */}
                <TableCell className="py-4 pr-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-slate-400 hover:text-cf-primary hover:bg-cf-primary/8 rounded-lg"
                      title={t.table.viewDetails}
                      onClick={(e) => { e.stopPropagation(); setDetailTarget(d); }}
                    >
                      <IconEye className="h-4 w-4" stroke={1.8} />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-slate-400 hover:text-cf-primary hover:bg-cf-primary/8 rounded-lg"
                      title={t.table.copyLink}
                      onClick={(e) => copyLink(e, d)}
                    >
                      {copiedId === d.id
                        ? <IconCheck className="h-4 w-4 text-green-500" />
                        : <IconCopy  className="h-4 w-4" stroke={1.8} />
                      }
                    </Button>
                    {!TERMINAL.has(d.status) && (
                      <Button
                        size="icon" variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-cf-primary hover:bg-cf-primary/8 rounded-lg"
                        title={t.table.assignDriver}
                        onClick={(e) => { e.stopPropagation(); setAssignTarget(d); }}
                      >
                        <IconUserPlus className="h-4 w-4" stroke={1.8} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AssignDriverDialog
        delivery={assignTarget}
        open={assignTarget !== null}
        onOpenChange={(o) => { if (!o) setAssignTarget(null); }}
        onAssigned={(updated) => { onDeliveryUpdated(updated); setAssignTarget(null); }}
      />

      <DeliveryDetailSheet
        delivery={detailTarget}
        open={detailTarget !== null}
        onOpenChange={(o) => { if (!o) setDetailTarget(null); }}
        onDeliveryUpdated={(updated) => { onDeliveryUpdated(updated); setDetailTarget(updated); }}
      />
    </>
  );
}
