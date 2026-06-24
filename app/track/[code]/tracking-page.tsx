"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconTruck, IconPackage, IconMapPin, IconCircleCheck,
  IconClock, IconAlertTriangle, IconUserCheck, IconLanguage, IconMoon, IconSun
} from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/context";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { DashboardDict } from "@/lib/i18n/dictionary";

const LiveMap = dynamic(() => import("./live-map"), { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse" /> });

/* ── CSS animations injected once ──────────────────────────────────────── */

const STYLES = `
  @keyframes cf-shimmer {
    0%   { background-position: -400% 0; }
    100% { background-position:  400% 0; }
  }
  @keyframes cf-fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes cf-blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  .animate-blob {
    animation: cf-blob 7s infinite;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  .cf-skel {
    background: linear-gradient(90deg, rgba(200,200,200,0.1) 25%, rgba(200,200,200,0.2) 50%, rgba(200,200,200,0.1) 75%);
    background-size: 400% 100%;
    animation: cf-shimmer 1.6s ease-in-out infinite;
    border-radius: 6px;
  }
  .cf-fade-in {
    animation: cf-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
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
  { key: "PENDING",    labelKey: "orderCreated",   icon: IconPackage    },
  { key: "ASSIGNED",   labelKey: "driverAssigned", icon: IconUserCheck  },
  { key: "PICKED_UP",  labelKey: "pickedUp",       icon: IconTruck      },
  { key: "IN_TRANSIT", labelKey: "inTransit",      icon: IconMapPin     },
  { key: "DELIVERED",  labelKey: "delivered",      icon: IconCircleCheck },
] as const;

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0, ASSIGNED: 1, PICKED_UP: 2, IN_TRANSIT: 3, DELIVERED: 4,
};

const STATUS_CONFIG: Record<string, { labelKey: keyof DashboardDict["publicTracking"]; color: string; bg: string; border: string; iconColor: string }> = {
  PENDING:    { labelKey: "orderCreated",   color: "text-slate-700 dark:text-slate-300",  bg: "bg-slate-100/50 dark:bg-slate-800/50",  border: "border-slate-200 dark:border-slate-700",  iconColor: "text-slate-500 dark:text-slate-400"  },
  ASSIGNED:   { labelKey: "driverAssigned", color: "text-blue-700 dark:text-blue-400",   bg: "bg-blue-50/50 dark:bg-blue-900/20",   border: "border-blue-200 dark:border-blue-800/50",   iconColor: "text-blue-500 dark:text-blue-400"   },
  PICKED_UP:  { labelKey: "pickedUp",       color: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-50/50 dark:bg-amber-900/20",  border: "border-amber-200 dark:border-amber-800/50",  iconColor: "text-amber-500 dark:text-amber-400"  },
  IN_TRANSIT: { labelKey: "inTransit",      color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50/50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800/50", iconColor: "text-orange-500 dark:text-orange-400" },
  DELIVERED:  { labelKey: "delivered",      color: "text-emerald-700 dark:text-emerald-400",  bg: "bg-emerald-50/50 dark:bg-emerald-900/20",  border: "border-emerald-200 dark:border-emerald-800/50",  iconColor: "text-emerald-500 dark:text-emerald-400"  },
  FAILED:     { labelKey: "failedMsg",      color: "text-red-700 dark:text-red-400",    bg: "bg-red-50/50 dark:bg-red-900/20",    border: "border-red-200 dark:border-red-800/50",    iconColor: "text-red-500 dark:text-red-400"    },
  CANCELLED:  { labelKey: "cancelledMsg",   color: "text-slate-500 dark:text-slate-400",  bg: "bg-slate-50/50 dark:bg-slate-800/50",  border: "border-slate-200 dark:border-slate-700",  iconColor: "text-slate-400 dark:text-slate-500"  },
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-TZ", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Skel({ w, h, rounded = "6px", className = "" }: { w: string; h: string; rounded?: string; className?: string }) {
  return <div className={`cf-skel ${className}`} style={{ width: w, height: h, borderRadius: rounded }} />;
}

/* ── Shared header ──────────────────────────────────────────────────────── */

function Header() {
  const { lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 cf-fade-in">
      <div className="max-w-lg mx-auto flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-sm rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cf-primary to-emerald-400 flex items-center justify-center shadow-inner">
            <IconTruck className="h-4 w-4 text-white" stroke={2} />
          </div>
          <span className="font-heading text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cf-primary to-emerald-600 dark:from-emerald-400 dark:to-teal-300 tracking-tight">
            CourierFlow
          </span>
        </div>
        
        {mounted && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang(lang === "en" ? "sw" : "en")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              <IconLanguage className="h-4 w-4 text-cf-primary dark:text-emerald-400" />
              {lang.toUpperCase()}
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              {theme === "dark" ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-200/40 dark:bg-emerald-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-teal-200/40 dark:bg-teal-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-200/40 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" />
    </div>
  );
}

/* ── Skeleton page ──────────────────────────────────────────────────────── */

function PageSkeleton() {
  return (
    <>
      <style>{STYLES}</style>
      <AnimatedBackground />
      <Header />
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-28 pb-10 space-y-4">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-slate-800/60 shadow-xl p-6">
          <Skel w="60px"  h="12px" className="mb-3" />
          <Skel w="240px" h="36px" className="mb-6" />
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-800/50 px-5 py-4">
            <Skel w="48px" h="48px" rounded="50%" className="shrink-0" />
            <div className="space-y-2 flex-1">
              <Skel w="140px" h="24px" />
              <Skel w="90px"  h="14px" />
            </div>
          </div>
        </div>
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-slate-800/60 shadow-xl p-6">
          <Skel w="80px" h="20px" className="mb-6" />
          <div className="space-y-6">
            <Skel w="100%" h="60px" />
            <Skel w="100%" h="60px" />
          </div>
        </div>
      </main>
    </>
  );
}

/* ── Status card ────────────────────────────────────────────────────────── */

function StatusCard({ data, pt }: { data: TrackingData; pt: DashboardDict["publicTracking"] }) {
  const cfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.PENDING;
  const isMoving = data.status === "IN_TRANSIT";
  const isDone   = data.status === "DELIVERED";
  const isBad    = data.status === "FAILED" || data.status === "CANCELLED";

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl p-6 cf-fade-in relative overflow-hidden group">
      <div className={cn("absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-1000", isDone ? "bg-emerald-400" : isMoving ? "bg-orange-400" : "bg-blue-400")} />
      
      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">{pt.tracking}</p>
        <h1 className="font-heading text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-6 drop-shadow-sm">
          {data.trackingCode}
        </h1>

        <div className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${cfg.bg} ${cfg.border} shadow-sm backdrop-blur-md transition-all`}>
          <div className={`shrink-0 ${isMoving ? "animate-bounce" : ""}`}>
            {isDone && <IconCircleCheck  className={`h-12 w-12 ${cfg.iconColor}`} stroke={1.5} />}
            {isBad  && <IconAlertTriangle className={`h-12 w-12 ${cfg.iconColor}`} stroke={1.5} />}
            {!isDone && !isBad && <IconTruck className={`h-12 w-12 ${cfg.iconColor}`} stroke={1.5} />}
          </div>
          <div>
            <p className={`font-heading text-2xl font-bold leading-tight ${cfg.color}`}>{pt[cfg.labelKey] as string}</p>
            {data.driverName && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                <IconUserCheck className="h-4 w-4" />
                {pt.driver}: {data.driverName}
              </p>
            )}
          </div>
        </div>

        {isDone && data.deliveredAt && (
          <div className="mt-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 font-medium text-sm">
            <IconCircleCheck className="h-5 w-5 shrink-0" />
            <p>{pt.deliveredOn} {fmtDate(data.deliveredAt)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Journey card ───────────────────────────────────────────────────────── */

function JourneyCard({ data, pt }: { data: TrackingData; pt: DashboardDict["publicTracking"] }) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl p-6 cf-fade-in" style={{ animationDelay: "60ms" }}>
      <h2 className="font-heading text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <IconMapPin className="h-6 w-6 text-cf-primary dark:text-emerald-400" />
        {pt.journey}
      </h2>
      
      <div className="flex gap-5">
        <div className="flex flex-col items-center pt-1.5 shrink-0">
          <div className="h-3 w-3 rounded-full bg-cf-primary dark:bg-emerald-400 shadow-[0_0_0_4px_rgba(11,93,94,0.1)] dark:shadow-[0_0_0_4px_rgba(52,211,153,0.1)]" />
          <div className="w-px flex-1 bg-gradient-to-b from-cf-primary/50 to-slate-200 dark:from-emerald-400/50 dark:to-slate-700 my-2 min-h-[44px]" />
          <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />
        </div>
        <div className="flex-1 space-y-6 min-w-0">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cf-primary dark:text-emerald-400 mb-1">{pt.from}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">{data.pickupAddress}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{pt.to}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">{data.deliveryAddress}</p>
            {data.city && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.city}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Timeline card ──────────────────────────────────────────────────────── */

function TimelineCard({ data, pt }: { data: TrackingData; pt: DashboardDict["publicTracking"] }) {
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
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl p-6 cf-fade-in" style={{ animationDelay: "120ms" }}>
      <h2 className="font-heading text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <IconClock className="h-6 w-6 text-cf-primary dark:text-emerald-400" />
        {pt.statusTimeline}
      </h2>

      {(isFailed || isCancelled) && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-4 mb-6 text-sm text-red-700 dark:text-red-400 font-medium">
          <IconAlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          {isFailed ? pt.failedMsg : pt.cancelledMsg}
        </div>
      )}

      <div className="relative">
        {STEPS.map((step, idx) => {
          const done    = idx < currentIdx || (data.status === "DELIVERED" && idx === 4);
          const current = idx === currentIdx && !isFailed && !isCancelled;
          const ts      = timestamps[step.key];
          const Icon    = step.icon;

          return (
            <div key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className={[
                  "h-8 w-8 rounded-full border-[3px] flex items-center justify-center mt-0.5 transition-all duration-500",
                  done    ? "bg-cf-primary border-cf-primary dark:bg-emerald-500 dark:border-emerald-500" : "",
                  current ? "bg-white dark:bg-slate-900 border-cf-primary dark:border-emerald-400 shadow-[0_0_0_6px_rgba(11,93,94,0.15)] dark:shadow-[0_0_0_6px_rgba(52,211,153,0.15)] animate-pulse" : "",
                  !done && !current ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" : "",
                ].filter(Boolean).join(" ")}>
                  {done    && <Icon className="h-4 w-4 text-white" stroke={2.5} />}
                  {current && <div className="h-2.5 w-2.5 rounded-full bg-cf-primary dark:bg-emerald-400" />}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-1 flex-1 my-2 min-h-[32px] rounded-full transition-colors duration-500 ${done ? "bg-cf-primary/40 dark:bg-emerald-500/40" : "bg-slate-100 dark:bg-slate-800"}`} />
                )}
              </div>

              <div className="pb-6 flex-1 min-w-0 pt-1.5">
                <p className={[
                  "text-base font-bold leading-tight transition-colors duration-300",
                  current ? "text-cf-primary dark:text-emerald-400" : done ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-600",
                ].join(" ")}>
                  {pt[step.labelKey] as string}
                  {current && (
                    <span className="ml-3 inline-block rounded-full bg-cf-primary/10 dark:bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cf-primary dark:text-emerald-400 align-middle">
                      {pt.now}
                    </span>
                  )}
                </p>
                {ts && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium">
                    <IconClock className="h-3.5 w-3.5 shrink-0 opacity-70" />
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
  const { t } = useLanguage();
  const pt = t.publicTracking;

  function load() {
    setState("loading");
    setData(null);
    const start = Date.now();

    fetch(`/api/track/${encodeURIComponent(code)}`)
      .then(async (res) => {
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

  useEffect(() => { load(); }, [code]);

  /* Loading */
  if (state === "loading") return <PageSkeleton />;

  /* Not found */
  if (state === "not_found") return (
    <>
      <style>{STYLES}</style>
      <AnimatedBackground />
      <Header />
      <main className="relative z-10 max-w-lg mx-auto px-4 py-32 text-center cf-fade-in">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl p-10">
          <IconPackage className="h-20 w-20 text-slate-300 dark:text-slate-700 mx-auto mb-6" stroke={1} />
          <h2 className="font-heading text-2xl font-bold text-slate-800 dark:text-white mb-3">{pt.notFoundTitle}</h2>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {pt.notFoundDesc}
          </p>
          <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 inline-block shadow-inner">
            <p className="font-mono text-sm font-bold tracking-widest text-slate-600 dark:text-slate-300">
              {code}
            </p>
          </div>
        </div>
      </main>
    </>
  );

  /* Rate limited */
  if (state === "rate_limited") return (
    <>
      <style>{STYLES}</style>
      <AnimatedBackground />
      <Header />
      <main className="relative z-10 max-w-lg mx-auto px-4 py-32 text-center cf-fade-in">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl p-10">
          <IconClock className="h-20 w-20 text-amber-400 mx-auto mb-6" stroke={1.2} />
          <h2 className="font-heading text-2xl font-bold text-slate-800 dark:text-white mb-3">{pt.rateLimitedTitle}</h2>
          <p className="text-base text-slate-500 dark:text-slate-400">{pt.rateLimitedDesc}</p>
        </div>
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

  /* Success found */
  return (
    <>
      <style>{STYLES}</style>
      <AnimatedBackground />
      <Header />
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-28 pb-12 space-y-5">
        <StatusCard data={data} pt={pt} />
        <LiveLocationCard code={code} status={data.status} pt={pt} />
        <JourneyCard data={data} pt={pt} />
        <TimelineCard data={data} pt={pt} />

        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 pb-6 pt-4 font-medium tracking-wide">
          Powered by CourierFlow · Tanzania
        </p>
      </main>
    </>
  );
}

/* ── Live Location Card (SSE) ───────────────────────────────────────────── */

function LiveLocationCard({ code, status, pt }: { code: string; status: string; pt: DashboardDict["publicTracking"] }) {
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
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl overflow-hidden cf-fade-in" style={{ animationDelay: "90ms" }}>
      {/* Header bar */}
      <div className={`px-6 py-4 flex items-center justify-between transition-colors duration-500 ${
        !loc ? "bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50"
        : isLive ? "bg-emerald-500 dark:bg-emerald-600"
        : "bg-amber-500 dark:bg-amber-600"
      }`}>
        <div className="flex items-center gap-3">
          {!loc ? (
            <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse" />
          ) : isLive ? (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
            </span>
          ) : (
            <div className="h-3 w-3 rounded-full bg-white/70" />
          )}
          <span className={`text-sm font-bold tracking-wide ${!loc ? "text-slate-700 dark:text-slate-300" : "text-white"}`}>
            {!loc
              ? pt.liveLocationTitle
              : isLive
                ? pt.driverOnWay
                : isStale
                  ? `${pt.lastSeen} ${secsAgo < 3600 ? Math.floor(secsAgo / 60) + "m" : Math.floor(secsAgo / 3600) + "h"} ${pt.ago}`
                  : pt.locUpdating}
          </span>
        </div>
        {loc && (
          <a
            href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-white/90 hover:text-white transition-colors"
          >
            {pt.openMaps}
          </a>
        )}
      </div>

      {/* Body */}
      <div className="relative w-full h-[250px] bg-slate-100 dark:bg-slate-800">
        {!loc ? (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="flex items-start gap-4">
              <IconTruck className="h-10 w-10 text-slate-300 dark:text-slate-600 shrink-0 mt-1" stroke={1.5} />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {connected ? pt.gpsNotActive : pt.connectingLive}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {connected ? pt.locWillAppear : pt.establishingConn}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full w-full relative">
            <LiveMap lat={loc.lat} lng={loc.lng} accuracy={loc.accuracy} />
            {loc.accuracy != null && (
              <div className="absolute bottom-3 left-3 z-10">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <IconMapPin className="h-3 w-3 shrink-0 text-emerald-500" />
                    {pt.accuracy}{Math.round(loc.accuracy)}m
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
