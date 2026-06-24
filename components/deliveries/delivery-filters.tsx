"use client";

import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { IconSearch, IconX, IconFilter } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/context";
import type { FilterState } from "./types";

const STATUS_OPTIONS = [
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
] as const;

const inputCls =
  "h-9 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cf-primary/30 " +
  "focus:border-cf-primary transition-colors hover:border-slate-300";

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

export function DeliveryFilters({ filters, onChange }: Props) {
  const { t } = useLanguage();
  const hasActive = Object.values(filters).some(Boolean);

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-100 shadow-sm px-5 py-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
          <IconFilter className="h-3.5 w-3.5" stroke={2} />
          {t.deliveries.filter}
        </div>

        {/* Tracking code search */}
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" stroke={1.8} />
          <input
            type="text"
            placeholder={t.deliveries.searchCode}
            value={filters.trackingCode}
            onChange={(e) => onChange({ ...filters, trackingCode: e.target.value })}
            className={`${inputCls} w-[190px] pl-8 pr-3`}
          />
        </div>

        {/* Status select */}
        <Select
          value={filters.status || "_all"}
          onValueChange={(v) => onChange({ ...filters, status: v && v !== "_all" ? v : "" })}
        >
          <SelectTrigger className={`${inputCls} w-[170px] px-3`}>
            <SelectValue placeholder={t.deliveries.allStatuses} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{t.deliveries.allStatuses}</SelectItem>
            {STATUS_OPTIONS.map((val) => (
              <SelectItem key={val} value={val}>{t.deliveries.statuses[val]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => onChange({ ...filters, from: e.target.value })}
            title="From date"
            className={`${inputCls} w-[150px] px-3`}
          />
          <span className="text-xs text-slate-400">—</span>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => onChange({ ...filters, to: e.target.value })}
            title="To date"
            className={`${inputCls} w-[150px] px-3`}
          />
        </div>

        {/* Clear */}
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ status: "", trackingCode: "", from: "", to: "" })}
            className="h-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-3"
          >
            <IconX className="mr-1.5 h-3.5 w-3.5" />
            {t.deliveries.clear}
          </Button>
        )}
      </div>
    </div>
  );
}
