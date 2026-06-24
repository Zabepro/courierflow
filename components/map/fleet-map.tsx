"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  IconTruck, IconRefresh, IconWifi, IconWifiOff, IconSearch,
  IconFocusCentered, IconChevronRight, IconChevronLeft, IconMapPinOff, IconX,
  IconInfoCircle,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

/* Leaflet must not run on server */
const FleetMapInner = dynamic(() => import("./fleet-map-inner"), {
  ssr:     false,
  loading: () => {
    return <LoadingMapPlaceholder />;
  },
});

function LoadingMapPlaceholder() {
  const { t } = useLanguage();
  return (
    <div className="flex h-full items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cf-primary border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">{t.map.loadingMap}</p>
      </div>
    </div>
  );
}

export type DriverPin = {
  deliveryId:    string;
  trackingCode:  string;
  status:        string;
  recipientName: string;
  city:          string | null;
  driverId:      string;
  driverName:    string;
  driverPhone:   string | null;
  location: {
    lat:      number;
    lng:      number;
    accuracy: number | null;
    ts:       string;
  } | null;
};

const STATUS_DOT: Record<string, string> = {
  ASSIGNED:   "bg-blue-500",
  PICKED_UP:  "bg-amber-500",
  IN_TRANSIT: "bg-orange-500",
};

function secsAgo(ts: string): number {
  return (Date.now() - new Date(ts).getTime()) / 1000;
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => (w[0] ?? "").toUpperCase()).join("") || "?";
}

export function FleetMap() {
  const { t } = useLanguage();
  const m = t.map;

  const [pins, setPins]             = useState<DriverPin[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [, setTick]                 = useState(0);

  /* UI state */
  const [query, setQuery]           = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [fitAllNonce, setFitAllNonce] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [legendOpen, setLegendOpen]   = useState(false);

  const fetchPins = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/fleet/locations");
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as DriverPin[];
      setPins(data);
      setLastUpdate(new Date());
      setError(false);
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /* Poll every 5s; on consecutive failures, back off exponentially up to 60s
     so a backend hiccup doesn't turn into a request storm. */
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const BASE_MS = 5_000;
    const MAX_MS  = 60_000;
    let failures  = 0;

    const tick = async () => {
      const ok = await fetchPins();
      if (cancelled) return;
      failures   = ok ? 0 : failures + 1;
      const delay = ok ? BASE_MS : Math.min(BASE_MS * 2 ** failures, MAX_MS);
      timer = setTimeout(() => void tick(), delay);
    };

    void tick();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fetchPins]);

  /* Tick every second for "last updated X ago" label */
  useEffect(() => {
    const iv = setInterval(() => setTick((n) => n + 1), 1_000);
    return () => clearInterval(iv);
  }, []);

  const liveCount   = pins.filter((p) => p.location && secsAgo(p.location.ts) < 60).length;
  const staleCount  = pins.filter((p) => p.location && secsAgo(p.location.ts) >= 60).length;
  const noGpsCount  = pins.filter((p) => !p.location).length;
  const totalActive = pins.length;

  const secondsAgo = lastUpdate ? Math.floor((Date.now() - lastUpdate.getTime()) / 1000) : null;

  /* Filtered + sorted list — live drivers first, then stale, then no-GPS */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? pins.filter(
          (p) =>
            p.driverName.toLowerCase().includes(q) ||
            p.trackingCode.toLowerCase().includes(q) ||
            p.recipientName.toLowerCase().includes(q) ||
            (p.city ?? "").toLowerCase().includes(q),
        )
      : pins;

    const rank = (p: DriverPin) =>
      !p.location ? 2 : secsAgo(p.location.ts) < 60 ? 0 : 1;

    return [...matched].sort((a, b) => rank(a) - rank(b));
  }, [pins, query]);

  const selectDriver = (pin: DriverPin) => {
    setSelectedId(pin.deliveryId);
    if (pin.location) setFocusNonce((n) => n + 1);
  };

  return (
    <div className="relative h-full w-full">
      {/* ── Top overlay bar ─────────────────────────────── */}
      <div className="absolute top-3 left-1/2 z-[1000] -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur-sm px-4 py-2.5">
          <IconTruck className="h-4 w-4 text-cf-primary shrink-0" stroke={2} />
          <span className="text-sm font-bold text-slate-800">{m.fleetLive}</span>
          <div className="mx-2 h-4 w-px bg-slate-200" />

          {/* Stats pills */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {liveCount} {m.live}
            </span>
            {staleCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {staleCount} {m.stale}
              </span>
            )}
            {noGpsCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                {noGpsCount} {m.noGps}
              </span>
            )}
            {totalActive === 0 && !loading && (
              <span className="text-xs text-slate-400 font-medium">{m.noActive}</span>
            )}
          </div>

          <div className="mx-2 h-4 w-px bg-slate-200" />

          {/* Sync indicator */}
          <div className="flex items-center gap-1.5">
            {error ? (
              <IconWifiOff className="h-3.5 w-3.5 text-red-400" stroke={2} />
            ) : (
              <IconWifi className="h-3.5 w-3.5 text-emerald-500" stroke={2} />
            )}
            <span className="text-[11px] text-slate-400 tabular-nums">
              {secondsAgo !== null ? `${secondsAgo}s ${m.ago}` : "—"}
            </span>
            <button
              onClick={() => void fetchPins()}
              className="ml-1 rounded-lg p-1 hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <IconRefresh className="h-3.5 w-3.5 text-slate-400" stroke={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Map controls (top-right, beside sidebar) ─────── */}
      <div className="absolute top-3 right-4 z-[1001] flex items-center gap-2">
        <button
          onClick={() => setFitAllNonce((n) => n + 1)}
          disabled={liveCount + staleCount === 0}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur-sm px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Fit all drivers in view"
        >
          <IconFocusCentered className="h-4 w-4" stroke={2} />
          {m.fitAll}
        </button>
        {!sidebarOpen && totalActive > 0 && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur-sm px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            title="Show driver list"
          >
            <IconChevronLeft className="h-4 w-4" stroke={2} />
            {m.drivers}
          </button>
        )}
      </div>

      {/* ── Legend (bottom-left, collapsible so it never blocks the map) ── */}
      <div className="absolute bottom-8 left-4 z-[1000]">
        {!legendOpen ? (
          <button
            onClick={() => setLegendOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-600 shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-50"
            title="Show legend"
          >
            <IconInfoCircle className="h-4 w-4 text-cf-primary" stroke={2} />
            {m.legend}
          </button>
        ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur-sm px-4 py-3 space-y-2">
          <div className="flex items-center justify-between gap-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{m.legend}</p>
            <button
              onClick={() => setLegendOpen(false)}
              className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="Hide legend"
            >
              <IconX className="h-3.5 w-3.5" stroke={2} />
            </button>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[8px] font-bold text-white shrink-0">AB</span>
              <span className="text-xs text-slate-600 font-medium">{m.liveDesc}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white shrink-0">AB</span>
              <span className="text-xs text-slate-600 font-medium">{m.staleDesc}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-400 text-[8px] font-bold text-white shrink-0">AB</span>
              <span className="text-xs text-slate-600 font-medium">{m.offlineDesc}</span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{m.status}</p>
            {[
              { dot: "bg-blue-500",   label: m.assigned   },
              { dot: "bg-amber-500",  label: m.pickedUp  },
              { dot: "bg-orange-500", label: m.inTransit },
            ].map(({ dot, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
                <span className="text-xs text-slate-600 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* ── Driver list sidebar (right) ──────────────────── */}
      {sidebarOpen && totalActive > 0 && (
        <div className="absolute top-16 right-4 z-[1000] flex w-72 max-h-[calc(100%-6rem)] flex-col">
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-700">
                {totalActive} {totalActive === 1 ? m.activeDelivery : m.activeDeliveries}
              </p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title="Hide list"
              >
                <IconChevronRight className="h-4 w-4" stroke={2} />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2.5 border-b border-slate-100">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" stroke={2} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={m.search}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-1.5 pl-8 pr-7 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:border-cf-primary/40 focus:bg-white"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <IconX className="h-3.5 w-3.5" stroke={2} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-50 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <IconSearch className="h-6 w-6 text-slate-300" stroke={1.5} />
                  <p className="text-xs font-medium text-slate-400">{m.noMatch} “{query}”</p>
                </div>
              ) : (
                filtered.map((pin) => {
                  const hasLoc   = !!pin.location;
                  const isLive   = hasLoc && secsAgo(pin.location!.ts) < 60;
                  const isStale  = hasLoc && secsAgo(pin.location!.ts) >= 60;
                  const dot      = STATUS_DOT[pin.status] ?? "bg-slate-400";
                  const selected = selectedId === pin.deliveryId;

                  return (
                    <button
                      key={pin.deliveryId}
                      onClick={() => selectDriver(pin)}
                      className={cn(
                        "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                        selected ? "bg-cf-primary/8 ring-1 ring-inset ring-cf-primary/20" : "hover:bg-slate-50",
                        !hasLoc && "opacity-70",
                      )}
                    >
                      {/* Driver avatar */}
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                        isLive ? "bg-teal-500" : isStale ? "bg-amber-500" : "bg-slate-300",
                      )}>
                        {initials(pin.driverName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs font-bold text-slate-800">{pin.driverName}</p>
                          {isLive  && <span className="shrink-0 text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-1.5 py-0.5">LIVE</span>}
                          {isStale && <span className="shrink-0 text-[9px] font-bold text-amber-600 bg-amber-50 rounded-full px-1.5 py-0.5">STALE</span>}
                          {!hasLoc && <span className="shrink-0 text-[9px] font-bold text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">NO GPS</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
                          <p className="truncate text-[11px] text-slate-500">{pin.trackingCode}</p>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className="truncate text-[10px] text-slate-400">{pin.recipientName}</p>
                          {pin.location && (
                            <p className="shrink-0 text-[10px] text-slate-400 tabular-nums">
                              {Math.floor(secsAgo(pin.location.ts))}s {m.ago}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state (no active deliveries at all) ────── */}
      {totalActive === 0 && !loading && (
        <div className="absolute top-1/2 left-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-8 py-7 text-center shadow-lg backdrop-blur-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <IconMapPinOff className="h-7 w-7 text-slate-400" stroke={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{m.noActive}</p>
              <p className="mt-1 text-xs text-slate-400">{m.noActiveDesc}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Map itself ───────────────────────────────────── */}
      <FleetMapInner
        pins={pins}
        focusId={selectedId}
        focusNonce={focusNonce}
        fitAllNonce={fitAllNonce}
      />

      {/* ── Loading overlay ──────────────────────────────── */}
      {loading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cf-primary border-t-transparent" />
            <p className="text-sm font-medium text-slate-600">{m.loadingData}</p>
          </div>
        </div>
      )}
    </div>
  );
}
