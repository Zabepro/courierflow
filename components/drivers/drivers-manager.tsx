"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  IconPlus, IconRefresh, IconUsers, IconAlertTriangle,
  IconSettings, IconTruck, IconCircleCheck, IconPhone, IconMail,
  IconUserCheck, IconClockHour4, IconSearch, IconUsersGroup,
  IconCopy, IconBrandWhatsapp,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddDriverDialog } from "./add-driver-dialog";
import type { DriverRow } from "./types";

function initials(name: string | null, email: string): string {
  const base = name?.trim() || email;
  return base.split(/\s+/).slice(0, 2).map((w) => (w[0] ?? "").toUpperCase()).join("") || "?";
}

type StatusMeta = { label: string; badge: string; dot: string };

function getStatus(d: DriverRow): StatusMeta {
  if (d.pending)
    return { label: "Invite Pending", badge: "bg-amber-50 text-amber-600 ring-1 ring-amber-200", dot: "bg-amber-400" };
  if (d.activeDeliveries > 0)
    return { label: "On the Road", badge: "bg-orange-50 text-orange-600 ring-1 ring-orange-200", dot: "bg-orange-500" };
  return { label: "Available", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" };
}

/* ── Summary card ─────────────────────────────────────────────────────────── */

function SummaryCard({ label, value, icon: Icon, iconBg, accent }: {
  label: string; value: number; icon: React.ElementType; iconBg: string; accent: string;
}) {
  return (
    <Card className="relative overflow-hidden bg-white border-0 ring-1 ring-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-3xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" stroke={1.8} />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-0.5 w-full ${accent}`} />
    </Card>
  );
}

/* ── Driver card ──────────────────────────────────────────────────────────── */

function DriverCard({ d }: { d: DriverRow }) {
  const status = getStatus(d);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!d.inviteLink) return;
    try {
      await navigator.clipboard.writeText(d.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  }

  const waMessage = `Habari ${d.name ?? ""}, umealikwa kuwa dereva CourierFlow. Fungua hii kujiunga: ${d.inviteLink ?? ""}`;
  const waDigits  = (d.phone ?? "").replace(/\D/g, "");
  const waLink    = `https://wa.me/${waDigits}?text=${encodeURIComponent(waMessage)}`;

  return (
    <Card className="group bg-white border-0 ring-1 ring-slate-100 shadow-sm hover:shadow-md hover:ring-cf-primary/25 transition-all duration-200 overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-cf-primary via-cf-primary/50 to-transparent" />

      <div className="p-5">
        {/* Avatar + name + status */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cf-primary text-sm font-bold text-white shadow-sm select-none">
            {initials(d.name, d.email)}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-heading font-semibold text-slate-900 truncate leading-tight">
              {d.name ?? "Unnamed driver"}
            </p>
            <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        {/* Contact */}
        <div className="mb-4 space-y-1.5">
          {d.phone && (
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-100">
                <IconPhone className="h-3.5 w-3.5 text-slate-400" stroke={1.8} />
              </span>
              {d.phone}
            </div>
          )}
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-100">
              <IconMail className="h-3.5 w-3.5 text-slate-400" stroke={1.8} />
            </span>
            <span className="truncate">{d.email}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-xl bg-slate-50/80 ring-1 ring-slate-100">
          <div className="flex flex-col items-center py-3">
            <p className="font-heading text-xl font-bold text-orange-500 tabular-nums leading-none">
              {d.activeDeliveries}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Active</p>
          </div>
          <div className="flex flex-col items-center py-3">
            <p className="font-heading text-xl font-bold text-emerald-600 tabular-nums leading-none">
              {d.completedDeliveries}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Done</p>
          </div>
          <div className="flex flex-col items-center py-3">
            <p className="font-heading text-xl font-bold text-slate-700 tabular-nums leading-none">
              {d.totalDeliveries}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</p>
          </div>
        </div>

        {/* Invite link — only while the driver hasn't joined yet */}
        {d.pending && d.inviteLink && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Invite link</p>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cf-primary/10 px-3 py-2 text-xs font-bold text-cf-primary transition-colors hover:bg-cf-primary/15"
              >
                {copied
                  ? <><IconCircleCheck className="h-3.5 w-3.5" stroke={2.5} /> Copied</>
                  : <><IconCopy className="h-3.5 w-3.5" stroke={2} /> Copy link</>}
              </button>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-bold text-green-600 transition-colors hover:bg-green-500/15"
              >
                <IconBrandWhatsapp className="h-3.5 w-3.5" stroke={2} /> WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Skeleton grid ────────────────────────────────────────────────────────── */

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden border-0 ring-1 ring-slate-100 shadow-sm">
          <Skeleton className="h-[3px] w-full rounded-none" />
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2 pt-0.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── Setup needed ─────────────────────────────────────────────────────────── */

function SetupNeededCard() {
  const [loading, setLoading] = useState(false);
  const handleSetup = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/dev/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Setup complete! Refreshing…");
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
    <Card className="flex flex-col items-center justify-center py-20 text-center bg-white border-0 ring-1 ring-slate-100 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-5">
        <IconSettings className="h-8 w-8 text-slate-400" stroke={1.5} />
      </div>
      <h3 className="font-heading text-lg font-semibold text-slate-800 mb-1">Account not set up</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        Your account is not linked to an organization yet. Click below to complete setup.
      </p>
      <Button onClick={handleSetup} disabled={loading} className="bg-cf-primary hover:bg-cf-primary/90 text-white">
        {loading ? "Setting up…" : "Complete Setup"}
      </Button>
    </Card>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

export function DriversManager() {
  const [drivers, setDrivers]   = useState<DriverRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [setupNeeded, setSetup] = useState(false);
  const [addOpen, setAddOpen]   = useState(false);
  const [search, setSearch]     = useState("");

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/drivers");
      if (res.status === 403) { setSetup(true); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDrivers((await res.json()) as DriverRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchDrivers(); }, [fetchDrivers]);

  const handleCreated = (d: DriverRow) => {
    setDrivers((prev) =>
      [d, ...prev].sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email))
    );
    setAddOpen(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.phone?.includes(q)
    );
  }, [drivers, search]);

  if (setupNeeded) return <SetupNeededCard />;

  const totalDrivers = drivers.length;
  const onTheRoad    = drivers.filter((d) => d.activeDeliveries > 0).length;
  const available    = drivers.filter((d) => !d.pending && d.activeDeliveries === 0).length;
  const pending      = drivers.filter((d) => d.pending).length;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" stroke={1.8} />
          <input
            type="text"
            placeholder="Search drivers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cf-primary/30 focus:border-cf-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="icon" className="h-9 w-9 border-slate-200"
            onClick={() => void fetchDrivers()} disabled={loading} title="Refresh"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-cf-primary hover:bg-cf-primary/90 text-white h-9 shadow-sm"
          >
            <IconPlus className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        </div>
      </div>

      {/* Summary */}
      {!loading && !error && totalDrivers > 0 && (
        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Drivers"  value={totalDrivers} icon={IconUsers}      iconBg="bg-cf-primary"  accent="bg-cf-primary" />
          <SummaryCard label="On the Road"    value={onTheRoad}    icon={IconTruck}      iconBg="bg-orange-500"  accent="bg-orange-500" />
          <SummaryCard label="Available"      value={available}    icon={IconUserCheck}  iconBg="bg-emerald-600" accent="bg-emerald-500" />
          <SummaryCard label="Invite Pending" value={pending}      icon={IconClockHour4} iconBg="bg-amber-500"   accent="bg-amber-400" />
        </div>
      )}

      {/* Body */}
      {loading ? (
        <GridSkeleton />
      ) : error ? (
        <Card className="flex flex-col items-center justify-center py-14 text-center border-0 ring-1 ring-red-100 bg-white shadow-sm">
          <IconAlertTriangle className="h-10 w-10 text-red-400 mb-3" stroke={1.5} />
          <p className="text-sm font-medium text-red-600 mb-1">Something went wrong</p>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void fetchDrivers()}>
            <IconRefresh className="mr-2 h-3.5 w-3.5" />
            Try Again
          </Button>
        </Card>
      ) : totalDrivers === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 bg-white shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cf-primary/8 mb-5">
            <IconUsersGroup className="h-8 w-8 text-cf-primary/50" stroke={1.5} />
          </div>
          <h3 className="font-heading text-lg font-semibold text-slate-800 mb-1">No drivers yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            Add your first driver so you can assign deliveries and track them on the fleet map.
          </p>
          <Button onClick={() => setAddOpen(true)} className="bg-cf-primary hover:bg-cf-primary/90 text-white shadow-sm">
            <IconPlus className="mr-2 h-4 w-4" />
            Add First Driver
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-14 text-center border-0 ring-1 ring-slate-100 bg-white shadow-sm">
          <IconSearch className="h-8 w-8 text-slate-300 mb-3" stroke={1.5} />
          <p className="text-sm font-medium text-slate-600 mb-1">No drivers match &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch("")} className="mt-2 text-xs text-cf-primary hover:underline">
            Clear search
          </button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => <DriverCard key={d.id} d={d} />)}
        </div>
      )}

      <AddDriverDialog open={addOpen} onOpenChange={setAddOpen} onCreated={handleCreated} />
    </div>
  );
}
