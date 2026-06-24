"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  IconPlus, IconRefresh, IconPackageOff, IconAlertTriangle,
  IconSettings, IconChevronLeft, IconChevronRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeliveryFilters } from "@/components/deliveries/delivery-filters";
import { DeliveryStats } from "@/components/deliveries/delivery-stats";
import { DeliveryTable } from "@/components/deliveries/delivery-table";
import { DeliveryTableSkeleton } from "@/components/deliveries/delivery-table-skeleton";
import { CreateDeliveryDialog } from "@/components/deliveries/create-delivery-dialog";
import type { ApiDelivery, DeliveriesResponse, FilterState } from "@/components/deliveries/types";
import { useLanguage } from "@/lib/i18n/context";
import { DashboardDict } from "@/lib/i18n/dictionary";

const DEFAULT_FILTERS: FilterState = { status: "", trackingCode: "", from: "", to: "" };
const PAGE_SIZE = 25;

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmptyState({ onCreate, t }: { onCreate: () => void; t: DashboardDict }) {
  return (
    <Card className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 bg-white shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cf-primary/8 mb-5">
        <IconPackageOff className="h-8 w-8 text-cf-primary/50" stroke={1.5} />
      </div>
      <h3 className="font-heading text-lg font-semibold text-slate-800 mb-1">
        {t.dashboard.emptyTitle}
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        {t.dashboard.emptyDesc}
      </p>
      <Button onClick={onCreate} className="bg-cf-primary hover:bg-cf-primary/90 text-white">
        <IconPlus className="mr-2 h-4 w-4" />
        {t.dashboard.createFirst}
      </Button>
    </Card>
  );
}

function FilteredEmptyState({ onClear, t }: { onClear: () => void; t: DashboardDict }) {
  return (
    <Card className="flex flex-col items-center justify-center py-14 text-center border border-dashed bg-white">
      <IconPackageOff className="h-10 w-10 text-slate-300 mb-3" stroke={1.5} />
      <p className="text-sm font-medium text-slate-600 mb-1">{t.dashboard.filterEmptyTitle}</p>
      <p className="text-xs text-slate-400 mb-4">{t.dashboard.filterEmptyDesc}</p>
      <Button variant="outline" size="sm" onClick={onClear}>{t.dashboard.clearFilters}</Button>
    </Card>
  );
}

function ErrorState({ message, onRetry, t }: { message: string; onRetry: () => void; t: DashboardDict }) {
  return (
    <Card className="flex flex-col items-center justify-center py-14 text-center border-red-100 bg-white">
      <IconAlertTriangle className="h-10 w-10 text-red-400 mb-3" stroke={1.5} />
      <p className="text-sm font-medium text-red-600 mb-1">{t.dashboard.errorTitle}</p>
      <p className="text-xs text-slate-400 mb-4">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <IconRefresh className="mr-2 h-3.5 w-3.5" />
        {t.dashboard.tryAgain}
      </Button>
    </Card>
  );
}

function SetupNeededCard({ t }: { t: DashboardDict }) {
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/dev/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Setup complete! Refreshing...");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error(data.error ?? "Setup failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col items-center justify-center py-20 text-center bg-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-5">
        <IconSettings className="h-8 w-8 text-slate-400" stroke={1.5} />
      </div>
      <h3 className="font-heading text-lg font-semibold mb-1">{t.dashboard.setupTitle}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        {t.dashboard.setupDesc}
      </p>
      <Button
        onClick={handleSetup}
        disabled={loading}
        className="bg-cf-primary hover:bg-cf-primary/90 text-white"
      >
        {loading ? "..." : t.dashboard.completeSetup}
      </Button>
    </Card>
  );
}

function Pagination({
  page, pages, total, onPage, t
}: { page: number; pages: number; total: number; onPage: (p: number) => void; t: DashboardDict }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-slate-500">
        {t.dashboard.pageOf.replace("{page}", String(page)).replace("{pages}", String(pages))} &mdash; {t.dashboard.deliveryCount.replace("{total}", total.toLocaleString())}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <IconChevronLeft className="h-4 w-4" />
        </Button>
        {/* Show up to 5 page buttons */}
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, pages - 4));
          const p = start + i;
          return (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              className={`h-8 w-8 p-0 text-xs ${p === page ? "bg-cf-primary hover:bg-cf-primary/90 text-white" : ""}`}
              onClick={() => onPage(p)}
            >
              {p}
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <IconChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DeliveriesSection() {
  const { t } = useLanguage();
  const [deliveries,  setDeliveries]  = useState<ApiDelivery[]>([]);
  const [total,       setTotal]       = useState(0);
  const [pages,       setPages]       = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [filters,     setFilters]     = useState<FilterState>(DEFAULT_FILTERS);
  const [createOpen,  setCreateOpen]  = useState(false);
  const [statsVersion, setStatsVersion] = useState(0);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  const fetchDeliveries = useCallback(async (f: FilterState, pg: number) => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      p.set("page",  String(pg));
      p.set("limit", String(PAGE_SIZE));
      if (f.status)       p.set("status",      f.status);
      if (f.trackingCode) p.set("trackingCode", f.trackingCode);
      if (f.from)         p.set("from", new Date(f.from).toISOString());
      if (f.to)           p.set("to",   new Date(f.to).toISOString());

      const res = await fetch(`/api/deliveries?${p}`);
      if (res.status === 403) { setSetupNeeded(true); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json: DeliveriesResponse = await res.json();
      setDeliveries(json.data);
      setTotal(json.meta.total);
      setPages(json.meta.pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchDeliveries(filters, 1), 300);
    return () => clearTimeout(debounce.current);
  }, [filters, fetchDeliveries]);

  // Re-fetch when page changes (without resetting page)
  useEffect(() => {
    fetchDeliveries(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleCreated = (d: ApiDelivery) => {
    setDeliveries((prev) => [d, ...prev.slice(0, PAGE_SIZE - 1)]);
    setTotal((t) => t + 1);
    setCreateOpen(false);
    setStatsVersion((v) => v + 1);
    toast.success(`Delivery ${d.trackingCode} created!`);
  };

  const handleDeliveryUpdated = (d: ApiDelivery) => {
    setDeliveries((prev) => prev.map((x) => (x.id === d.id ? d : x)));
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  if (setupNeeded) return <SetupNeededCard t={t} />;

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <DeliveryStats refreshSignal={statsVersion} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 tabular-nums">
            {loading ? "…" : total.toLocaleString()}
          </span>
          <span className="text-sm text-slate-400">
            {loading ? t.deliveries.loading : t.dashboard.deliveryCount.replace("{total}", "")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-slate-200"
            onClick={() => { fetchDeliveries(filters, page); setStatsVersion((v) => v + 1); }}
            disabled={loading}
            title={t.deliveries.refresh}
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-cf-primary hover:bg-cf-primary/90 text-white h-9 shadow-sm"
          >
            <IconPlus className="mr-2 h-4 w-4" />
            {t.deliveries.newDelivery}
          </Button>
        </div>
      </div>

      <DeliveryFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <DeliveryTableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchDeliveries(filters, page)} t={t} />
      ) : deliveries.length === 0 && !hasActiveFilters ? (
        <EmptyState onCreate={() => setCreateOpen(true)} t={t} />
      ) : deliveries.length === 0 ? (
        <FilteredEmptyState onClear={() => setFilters(DEFAULT_FILTERS)} t={t} />
      ) : (
        <>
          <DeliveryTable deliveries={deliveries} onDeliveryUpdated={handleDeliveryUpdated} />
          <Pagination page={page} pages={pages} total={total} onPage={setPage} t={t} />
        </>
      )}

      <CreateDeliveryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
