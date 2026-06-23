"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconTruck, IconPackage, IconMapPin, IconCircleCheck,
  IconClock, IconAlertTriangle, IconUserCheck,
} from "@tabler/icons-react";

/* ── CSS animations injected once ──────────────────────────────────────── */

const STYLES = `
  @keyframes cf-shimmer {
    0%   { background-position: -400% 0; }
    100% { background-position:  400% 0; }
  }
  @keyframes cf-fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .cf-skel {
    background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
    background-size: 400% 100%;
    animation: cf-shimmer 1.6s ease-in-out infinite;
    border-radius: 6px;
  }
  .cf-fade-in {
    animation: cf-fade-up 0.38s ease-out both;
  }
`;

/* ── Types ──────────────────────────────────────────────────────────────── */

type TrackingData = {
  trackingCode: string;
  status: string;
  priority: string;
  recipientName: string;
  pickupAddress: string;
  deliveryAddress: string;
  city: string | null;
  driverName: string | null;
  createdAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  lastUpdate: string | null;
};

type PageState = "loading" | "found" | "not_found" | "rate_limited" | "error";

/* ── Timeline config ────────────────────────────────────────────────────── */

const STEPS = [
  { key: "PENDING",    label: "Order Created",   icon: IconPackage    },
  { key: "ASSIGNED",   label: "Driver Assigned",  icon: IconUserCheck  },
  { key: "PICKED_UP",  label: "Picked Up",        icon: IconTruck      },
  { key: "IN_TRANSIT", label: "In Transit",       icon: IconMapPin     },
  { key: "DELIVERED",  label: "Delivered",        icon: IconCircleCheck },
] as const;

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0, ASSIGNED: 1, PICKED_UP: 2, IN_TRANSIT: 3, DELIVERED: 4,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; iconColor: string }> = {
  PENDING:    { label: "Pending",    color: "text-slate-600",  bg: "bg-slate-50",  border: "border-slate-200",  iconColor: "text-slate-400"  },
  ASSIGNED:   { label: "Assigned",   color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   iconColor: "text-blue-500"   },
  PICKED_UP:  { label: "Picked Up",  color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  iconColor: "text-amber-500"  },
  IN_TRANSIT: { label: "In Transit", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", iconColor: "text-orange-500" },
  DELIVERED:  { label: "Delivered",  color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  iconColor: "text-green-500"  },
  FAILED:     { label: "Failed",     color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    iconColor: "text-red-500"    },
  CANCELLED:  { label: "Cancelled",  color: "text-slate-500",  bg: "bg-slate-50",  border: "border-slate-200",  iconColor: "text-slate-400"  },
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-TZ", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}


/* ── Skeleton helper ────────────────────────────────────────────────────── */

function Skel({ w, h, rounded = "6px", className = "" }: { w: string; h: string; rounded?: string; className?: string }) {
  return (
    <div
      className={`cf-skel ${className}`}
      style={{ width: w, height: h, borderRadius: rounded }}
    />
  );
}

/* ── Shared header ──────────────────────────────────────────────────────── */

function Header() {
  return (
    <header className="bg-white border-b px-4 py-4 sticky top-0 z-10 shadow-sm">
      <div className="max-w-lg mx-auto flex items-center gap-2">
        <IconTruck className="h-5 w-5 text-cf-primary" stroke={1.8} />
        <span className="font-heading text-lg font-bold text-cf-primary tracking-tight">CourierFlow</span>
      </div>
    </header>
  );
}

/* ── Skeleton page (pixel-matches actual layout) ────────────────────────── */

function PageSkeleton() {
  return (
    <>
      <style>{STYLES}</style>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">

        {/* Status card */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <Skel w="52px"  h="10px" className="mb-2" />
          <Skel w="220px" h="30px" className="mb-5" />
          {/* Badge */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5">
            <Skel w="40px" h="40px" rounded="50%" className="shrink-0" />
            <div className="space-y-2 flex-1">
              <Skel w="120px" h="20px" />
              <Skel w="88px"  h="12px" />
            </div>
          </div>
        </div>

        {/* Journey card */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <Skel w="68px" h="18px" className="mb-5" />
          <div className="flex gap-4">
            <div className="flex flex-col items-center pt-1 shrink-0 gap-1.5">
              <Skel w="10px" h="10px" rounded="50%" />
              <div className="w-px flex-1 min-h-[44px] bg-slate-100" />
              <Skel w="16px" h="16px" rounded="50%" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <Skel w="30px"  h="10px" />
                <Skel w="180px" h="14px" />
              </div>
              <div className="space-y-1.5">
                <Skel w="18px"  h="10px" />
                <Skel w="160px" h="14px" />
                <Skel w="90px"  h="11px" />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline card */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <Skel w="128px" h="18px" className="mb-5" />
          {[140, 160, 90, 110, 75].map((w, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <Skel w="20px" h="20px" rounded="50%" className="mt-0.5" />
                {i < 4 && <div className="w-px flex-1 min-h-[24px] my-1 bg-slate-100" />}
              </div>
              <div className="pb-4 flex-1 space-y-1.5">
                <Skel w={`${w}px`} h="14px" />
                {i <= 1 && <Skel w="130px" h="10px" />}
              </div>
            </div>
          ))}
        </div>

      </main>
    </>
  );
}

/* ── Status card ────────────────────────────────────────────────────────── */

function StatusCard({ data }: { data: TrackingData }) {
  const cfg      = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.PENDING;
  const isMoving = data.status === "IN_TRANSIT";
  const isDone   = data.status === "DELIVERED";
  const isBad    = data.status === "FAILED" || data.status === "CANCELLED";

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 cf-fade-in">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Tracking</p>
      <h1 className="font-heading text-2xl font-bold text-cf-foreground tracking-tight mb-4">
        {data.trackingCode}
      </h1>

      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 ${cfg.bg} ${cfg.border}`}>
        <div className={`shrink-0 ${isMoving ? "animate-bounce" : ""}`}>
          {isDone && <IconCircleCheck  className={`h-9 w-9 ${cfg.iconColor}`} stroke={1.6} />}
          {isBad  && <IconAlertTriangle className={`h-9 w-9 ${cfg.iconColor}`} stroke={1.6} />}
          {!isDone && !isBad && <IconTruck className={`h-9 w-9 ${cfg.iconColor}`} stroke={1.6} />}
        </div>
        <div>
          <p className={`font-heading text-xl font-bold leading-tight ${cfg.color}`}>{cfg.label}</p>
          {data.driverName && (
            <p className="text-xs text-muted-foreground mt-0.5">Driver: {data.driverName}</p>
          )}
        </div>
      </div>

      {isDone && data.deliveredAt && (
        <p className="text-xs text-green-700 mt-2.5 flex items-center gap-1.5 font-medium">
          <IconCircleCheck className="h-3.5 w-3.5 shrink-0" />
          Delivered on {fmtDate(data.deliveredAt)}
        </p>
      )}
    </div>
  );
}

/* ── Journey card ───────────────────────────────────────────────────────── */

function JourneyCard({ data }: { data: TrackingData }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 cf-fade-in" style={{ animationDelay: "60ms" }}>
      <h2 className="font-heading font-semibold text-cf-foreground mb-4">Journey</h2>
      <div className="flex gap-4">
        <div className="flex flex-col items-center pt-1 shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-cf-primary" />
          <div className="w-px flex-1 bg-border/60 my-1.5 min-h-[44px]" />
          <IconMapPin className="h-4 w-4 text-cf-primary" />
        </div>
        <div className="flex-1 space-y-4 min-w-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">From</p>
            <p className="text-sm font-medium text-cf-foreground leading-snug">{data.pickupAddress}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">To</p>
            <p className="text-sm font-medium text-cf-foreground leading-snug">{data.deliveryAddress}</p>
            {data.city && <p className="text-xs text-muted-foreground mt-0.5">{data.city}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Timeline card ──────────────────────────────────────────────────────── */

function TimelineCard({ data }: { data: TrackingData }) {
  const isFailed    = data.status === "FAILED";
  const isCancelled = data.status === "CANCELLED";
  const currentIdx  = STATUS_ORDER[data.status] ?? 0;

  const timestamps: Record<string, string | null> = {
    PENDING:    data.createdAt,
    ASSIGNED:   null,
    PICKED_UP:  data.pickedUpAt,
    IN_TRANSIT: null,
    DELIVERED:  data.deliveredAt,
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 cf-fade-in" style={{ animationDelay: "120ms" }}>
      <h2 className="font-heading font-semibold text-cf-foreground mb-4">Status Timeline</h2>

      {(isFailed || isCancelled) && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 mb-4 text-sm text-red-700">
          <IconAlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          {isFailed ? "This delivery could not be completed." : "This delivery was cancelled."}
        </div>
      )}

      <div>
        {STEPS.map((step, idx) => {
          const done    = idx < currentIdx || (data.status === "DELIVERED" && idx === 4);
          const current = idx === currentIdx && !isFailed && !isCancelled;
          const ts      = timestamps[step.key];
          const Icon    = step.icon;

          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className={[
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all",
                  done    ? "bg-cf-primary border-cf-primary" : "",
                  current ? "bg-white border-cf-primary shadow-[0_0_0_4px_rgba(11,93,94,0.12)]" : "",
                  !done && !current ? "bg-white border-border" : "",
                ].filter(Boolean).join(" ")}>
                  {done    && <Icon className="h-2.5 w-2.5 text-white" />}
                  {current && <div className="h-2 w-2 rounded-full bg-cf-primary" />}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-px flex-1 my-1 min-h-[20px] transition-colors ${done ? "bg-cf-primary/40" : "bg-border"}`} />
                )}
              </div>

              <div className="pb-4 flex-1 min-w-0">
                <p className={[
                  "text-sm font-medium leading-tight",
                  current ? "text-cf-primary" : done ? "text-cf-foreground" : "text-muted-foreground/70",
                ].join(" ")}>
                  {step.label}
                  {current && (
                    <span className="ml-2 inline-block rounded-full bg-cf-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cf-primary align-middle">
                      Now
                    </span>
                  )}
                </p>
                {ts && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <IconClock className="h-3 w-3 shrink-0" />
                    {fmtDate(ts)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

export function TrackingPage({ code }: { code: string }) {
  const [state, setState] = useState<PageState>("loading");
  const [data,  setData]  = useState<TrackingData | null>(null);

  function load() {
    setState("loading");
    setData(null);
    const start = Date.now();

    fetch(`/api/track/${encodeURIComponent(code)}`)
      .then(async (res) => {
        // Always show skeleton for at least 700ms so the user sees the animation
        const elapsed = Date.now() - start;
        if (elapsed < 700) await new Promise(r => setTimeout(r, 700 - elapsed));

        if (res.status === 404) { setState("not_found"); return; }
        if (res.status === 429) { setState("rate_limited"); return; }
        if (!res.ok)            { setState("error"); return; }
        setData(await res.json());
        setState("found");
      })
      .catch(() => setState("error"));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [code]);

  /* Loading */
  if (state === "loading") return <PageSkeleton />;

  /* Not found */
  if (state === "not_found") return (
    <>
      <style>{STYLES}</style>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-20 text-center cf-fade-in">
        <IconPackage className="h-16 w-16 text-muted-foreground/30 mx-auto mb-5" stroke={1.2} />
        <h2 className="font-heading text-xl font-semibold text-cf-foreground mb-2">Tracking code not found</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Please double-check the code and try again. Contact the sender if the problem persists.
        </p>
        <p className="mt-5 font-mono text-xs bg-white border rounded-lg px-4 py-2.5 inline-block text-muted-foreground shadow-sm">
          {code}
        </p>
      </main>
    </>
  );

  /* Rate limited */
  if (state === "rate_limited") return (
    <>
      <style>{STYLES}</style>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-20 text-center cf-fade-in">
        <IconClock className="h-14 w-14 text-amber-400 mx-auto mb-4" stroke={1.5} />
        <h2 className="font-heading text-xl font-semibold mb-2">Too many requests</h2>
        <p className="text-sm text-muted-foreground">Please wait a minute before trying again.</p>
      </main>
    </>
  );

  /* Error */
  if (state === "error" || !data) return (
    <>
      <style>{STYLES}</style>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-20 text-center cf-fade-in">
        <IconAlertTriangle className="h-14 w-14 text-destructive/50 mx-auto mb-4" stroke={1.5} />
        <h2 className="font-heading text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-5">Unable to load tracking info.</p>
        <button
          onClick={load}
          className="text-sm font-medium text-cf-primary underline underline-offset-2 hover:opacity-75 transition-opacity"
        >
          Try again
        </button>
      </main>
    </>
  );

  /* Found */
  return (
    <>
      <style>{STYLES}</style>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        <StatusCard      data={data} />
        <LiveLocationCard code={code} status={data.status} />
        <JourneyCard     data={data} />
        <TimelineCard    data={data} />

        <p className="text-[10px] text-center text-muted-foreground/50 pb-6">
          Powered by CourierFlow · Tanzania
        </p>
      </main>
    </>
  );
}

/* ── Live Location Card (SSE) ───────────────────────────────────────────── */

function LiveLocationCard({ code, status }: { code: string; status: string }) {
  const isActive = status === "PICKED_UP" || status === "IN_TRANSIT";

  const [loc, setLoc]           = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [connected, setConnected] = useState(false);
  const [secsAgo, setSecsAgo]   = useState(0);
  const lastUpdateRef           = useRef<Date | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const es = new EventSource(`/api/track/${encodeURIComponent(code)}/stream`);

    es.onmessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as {
        found?: boolean; active?: boolean;
        lat?: number | null; lng?: number; accuracy?: number | null; ts?: string;
      };
      setConnected(true);
      if (data.active && data.lat != null && data.lng != null) {
        setLoc({ lat: data.lat, lng: data.lng, accuracy: data.accuracy ?? null });
        lastUpdateRef.current = new Date();
        setSecsAgo(0);
      }
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [code, isActive]);

  /* Live counter for EC-11 */
  useEffect(() => {
    const t = setInterval(() => {
      if (lastUpdateRef.current)
        setSecsAgo(Math.floor((Date.now() - lastUpdateRef.current.getTime()) / 1000));
    }, 1_000);
    return () => clearInterval(t);
  }, []);

  if (!isActive) return null;

  const isLive  = connected && !!loc && secsAgo < 60;
  const isStale = !!loc && secsAgo >= 60;

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden cf-fade-in" style={{ animationDelay: "90ms" }}>

      {/* Header bar */}
      <div className={`px-5 py-3 flex items-center justify-between ${
        !loc ? "bg-slate-50 border-b border-slate-100"
        : isLive ? "bg-green-600"
        : "bg-amber-500"
      }`}>
        <div className="flex items-center gap-2.5">
          {!loc ? (
            <div className="h-2.5 w-2.5 rounded-full bg-slate-300 animate-pulse" />
          ) : isLive ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
          ) : (
            <div className="h-2.5 w-2.5 rounded-full bg-white/70" />
          )}
          <span className={`text-sm font-bold ${!loc ? "text-slate-600" : "text-white"}`}>
            {!loc
              ? "Live Location"
              : isLive
                ? "Driver is on the way"
                : isStale
                  ? `Last seen ${secsAgo < 3600 ? Math.floor(secsAgo / 60) + "m" : Math.floor(secsAgo / 3600) + "h"} ago`
                  : "Location updating…"}
          </span>
        </div>
        {loc && (
          <a
            href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-white/90 hover:text-white underline underline-offset-2 transition-colors"
          >
            Open Maps →
          </a>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {!loc ? (
          <div className="flex items-start gap-3">
            <IconTruck className="h-9 w-9 text-cf-primary/30 shrink-0 mt-0.5" stroke={1.5} />
            <div>
              <p className="text-sm font-semibold text-cf-foreground">
                {connected ? "Driver GPS not yet active" : "Connecting to live tracking…"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {connected
                  ? "Location will appear here once the driver starts sharing their GPS."
                  : "Establishing connection — this takes a few seconds."}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-mono text-sm font-bold text-cf-foreground tabular-nums">
              {loc.lat.toFixed(5)}°&nbsp;&nbsp;{loc.lng.toFixed(5)}°
            </p>
            {loc.accuracy != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                GPS accuracy: ±{Math.round(loc.accuracy)}m
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
