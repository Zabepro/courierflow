"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  IconX, IconCopy, IconCheck, IconMapPin,
  IconTruck, IconCalendar, IconAlertCircle, IconExternalLink,
  IconUserCheck, IconClipboardCheck, IconDeviceMobile,
  IconCurrencyDollar, IconPhone, IconRefresh, IconCircleCheck,
  IconCircleX, IconLoader2, IconBrandWhatsapp, IconMessage,
  IconSend, IconHistory, IconClock, IconReplace,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { DeliveryStatusBadge } from "./delivery-status-badge";
import { AssignDriverDialog } from "./assign-driver-dialog";
import { cn, formatTZS } from "@/lib/utils";
import type { ApiDelivery } from "./types";
import type { DeliveryStatus } from "@/lib/generated/prisma/client";

/* ── Priority config (only URGENT + HIGH shown as badge) ────────────────── */

const PRIORITY_BADGE: Partial<Record<string, { label: string; cls: string }>> = {
  URGENT: { label: "Urgent", cls: "bg-red-50 text-red-600 border-red-200 ring-1 ring-red-200" },
  HIGH:   { label: "High",   cls: "bg-orange-50 text-orange-600 border-orange-200" },
};

/* ── Valid status transitions ────────────────────────────────────────────── */

type Btn = { status: DeliveryStatus; label: string; danger?: boolean };

const TRANSITIONS: Partial<Record<DeliveryStatus, Btn[]>> = {
  PENDING:    [],
  ASSIGNED:   [
    { status: "PICKED_UP",  label: "Mark as Picked Up" },
    { status: "CANCELLED",  label: "Cancel Delivery",   danger: true },
  ],
  PICKED_UP:  [{ status: "IN_TRANSIT", label: "Mark In Transit" }],
  /* DELIVERED is intentionally removed — driver must submit Proof of Delivery (EC-14) */
  IN_TRANSIT: [
    { status: "FAILED",    label: "Mark as Failed",    danger: true },
  ],
};

/* ── Avatar with initials ────────────────────────────────────────────────── */

function Avatar({ name, teal }: { name: string; teal?: boolean }) {
  const initials = name.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
  return (
    <div className={cn(
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
      teal ? "bg-cf-primary text-white" : "bg-slate-200 text-slate-600"
    )}>
      {initials}
    </div>
  );
}

/* ── Section wrapper ─────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      {children}
    </div>
  );
}

/* ── Field row ───────────────────────────────────────────────────────────── */

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" stroke={1.6} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-none mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

/* ── Format date ─────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-TZ", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Main component ─────────────────────────────────────────────────────── */

interface Props {
  delivery:          ApiDelivery | null;
  open:              boolean;
  onOpenChange:      (open: boolean) => void;
  onDeliveryUpdated: (d: ApiDelivery) => void;
}

export function DeliveryDetailSheet({ delivery, open, onOpenChange, onDeliveryUpdated }: Props) {
  const [current,       setCurrent]       = useState<ApiDelivery | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [assignOpen,    setAssignOpen]    = useState(false);
  const [copied,        setCopied]        = useState(false);

  const d          = current?.id === delivery?.id ? current : delivery;
  const transitions = TRANSITIONS[d?.status as DeliveryStatus] ?? [];
  const isTerminal  = ["DELIVERED", "FAILED", "CANCELLED"].includes(d?.status ?? "");
  const priCfg      = d ? PRIORITY_BADGE[d.priority] : undefined;

  function close() { onOpenChange(false); setCurrent(null); }

  function copyLink() {
    if (!d) return;
    const url = `${window.location.origin}/track/${d.trackingCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Tracking link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function changeStatus(newStatus: DeliveryStatus) {
    if (!d) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${d.id}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Status change failed");
        return;
      }
      const updated: ApiDelivery = await res.json();
      const next = { ...d, ...updated };
      setCurrent(next);
      onDeliveryUpdated(next);
      toast.success(`Delivery is now ${newStatus.replace("_", " ").toLowerCase()}`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setStatusLoading(false);
    }
  }

  if (!open || !d) return null;

  const trackingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/track/${d.trackingCode}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all"
        onClick={close}
      />

      {/* Sheet panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl sm:w-[500px]">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-cf-primary shrink-0" />

        {/* Header */}
        <div className="shrink-0 border-b bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Delivery Details
              </p>
              <h2 className="font-heading text-2xl font-bold text-slate-800 tracking-tight truncate">
                {d.trackingCode}
              </h2>
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <DeliveryStatusBadge status={d.status} />
                {priCfg && (
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                    priCfg.cls
                  )}>
                    {priCfg.label}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={close}
              className="mt-1 shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">

            {/* People */}
            <Section title="People">
              <div className="grid grid-cols-2 gap-3">
                {/* Sender */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sender</p>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={d.senderName} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 leading-tight truncate">{d.senderName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{d.senderPhone}</p>
                    </div>
                  </div>
                </div>
                {/* Recipient */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recipient</p>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={d.recipientName} teal />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 leading-tight truncate">{d.recipientName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{d.recipientPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Journey */}
            <Section title="Journey">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex gap-3.5">
                  <div className="flex flex-col items-center pt-1 shrink-0">
                    <div className="h-2.5 w-2.5 rounded-full bg-cf-primary" />
                    <div className="w-px flex-1 bg-slate-300 my-1.5 min-h-[32px]" />
                    <IconMapPin className="h-3.5 w-3.5 text-cf-primary" />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">From</p>
                      <p className="text-sm font-semibold text-slate-700 leading-snug">{d.pickupAddress}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">To</p>
                      <p className="text-sm font-semibold text-slate-700 leading-snug">{d.deliveryAddress}</p>
                      {d.city && <p className="text-xs text-slate-400 mt-0.5">{d.city}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Driver & Fee */}
            <Section title="Assignment">
              <div className="space-y-2.5">
                <Field
                  icon={IconTruck}
                  label="Driver"
                  value={d.driver?.name ?? "Not assigned"}
                />
                {d.driver?.phone && (
                  <Field
                    icon={IconUserCheck}
                    label="Driver Phone"
                    value={d.driver.phone}
                  />
                )}
                <Field
                  icon={IconMapPin}
                  label="Delivery Fee"
                  value={d.fee ? formatTZS(d.fee) : "Not set"}
                />
              </div>
            </Section>

            {/* Live Location — only for active deliveries */}
            {(d.status === "PICKED_UP" || d.status === "IN_TRANSIT") && (
              <LocationPanel deliveryId={d.id} trackingCode={d.trackingCode} />
            )}

            {/* Driver Portal banner — IN_TRANSIT: delivery must be confirmed via PoD */}
            {d.status === "IN_TRANSIT" && (
              <Section title="Confirm Delivery">
                <div className="rounded-xl border border-cf-primary/20 bg-cf-primary/5 overflow-hidden">
                  <div className="flex items-start gap-3 px-4 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cf-primary/10">
                      <IconDeviceMobile className="h-4 w-4 text-cf-primary" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700">Delivery must be confirmed by the driver</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        The driver opens their portal, captures proof (photo + recipient name), then marks as delivered.
                      </p>
                      <a
                        href={`/dashboard/driver/deliveries/${d.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-cf-primary px-3 py-2 text-xs font-bold text-white hover:bg-cf-primary/90 transition-colors"
                      >
                        <IconTruck className="h-3.5 w-3.5" strokeWidth={2} />
                        Open Driver Portal
                      </a>
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {/* Proof of Delivery — only when delivered */}
            {d.status === "DELIVERED" && (
              <PodPanel deliveryId={d.id} />
            )}

            {/* Payment — shown when delivery has a fee */}
            {d.fee && Number(d.fee) > 0 && (
              <PaymentPanel
                deliveryId={d.id}
                fee={d.fee}
                recipientPhone={d.recipientPhone}
                initialPayment={d.payment}
                onPaid={(updated) => {
                  const next = { ...d, payment: updated };
                  setCurrent(next);
                  onDeliveryUpdated(next);
                }}
              />
            )}

            {/* Timeline */}
            <Section title="Timeline">
              <div className="space-y-2.5">
                <Field icon={IconCalendar} label="Created"   value={fmtDate(d.createdAt)} />
                {d.pickedUpAt  && <Field icon={IconCalendar} label="Picked Up"  value={fmtDate(d.pickedUpAt)} />}
                {d.deliveredAt && <Field icon={IconCalendar} label="Delivered"  value={fmtDate(d.deliveredAt)} />}
              </div>
            </Section>

            {/* Notes */}
            {d.notes && (
              <Section title="Notes">
                <div className="rounded-xl border border-slate-100 bg-amber-50/60 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                  {d.notes}
                </div>
              </Section>
            )}

            {/* Tracking link */}
            <Section title="Tracking Link">
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <IconExternalLink className="h-4 w-4 shrink-0 text-slate-400" stroke={1.6} />
                <span className="flex-1 truncate text-xs text-slate-500 font-mono">{trackingUrl}</span>
                <a
                  href={`https://wa.me/${d.recipientPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Habari ${d.recipientName}, Mzigo wako unakuja! Unaweza kuufuatilia hapa: ${trackingUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#20b958] transition-colors"
                  title="Share via WhatsApp"
                >
                  <IconBrandWhatsapp className="h-3.5 w-3.5" /> Share
                </a>
                <button
                  onClick={copyLink}
                  title="Copy link"
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {copied
                    ? <><IconCheck className="h-3.5 w-3.5 text-green-600" /> Copied!</>
                    : <><IconCopy  className="h-3.5 w-3.5" /> Copy</>
                  }
                </button>
              </div>
            </Section>

            {/* SMS History */}
            <SmsPanel deliveryId={d.id} />

            {/* Terminal notice */}
            {isTerminal && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <IconAlertCircle className="h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-sm text-slate-500">
                  This delivery is <span className="font-semibold capitalize">{d.status.toLowerCase()}</span> — no further actions available.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Sticky footer — action buttons */}
        {!isTerminal && (
          <div className="shrink-0 border-t bg-slate-50 px-6 py-4 space-y-2">
            {(d.status === "PENDING" || (d.status === "ASSIGNED" && !d.driverId)) && (
              <Button
                className="w-full bg-cf-primary hover:bg-cf-primary/90 text-white h-10 font-medium"
                onClick={() => setAssignOpen(true)}
              >
                <IconUserCheck className="mr-2 h-4 w-4" />
                Assign Driver
              </Button>
            )}
            {transitions.map(({ status, label, danger }) => (
              <Button
                key={status}
                className={cn(
                  "w-full h-10 font-medium",
                  danger
                    ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                    : "bg-cf-primary hover:bg-cf-primary/90 text-white"
                )}
                variant={danger ? "outline" : "default"}
                disabled={statusLoading}
                onClick={() => changeStatus(status)}
              >
                {statusLoading ? "Updating..." : label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Assign driver dialog */}
      {d && (
        <AssignDriverDialog
          delivery={d}
          open={assignOpen}
          onOpenChange={setAssignOpen}
          onAssigned={(updated) => {
            const next = { ...d, ...updated };
            setCurrent(next);
            onDeliveryUpdated(next);
            setAssignOpen(false);
          }}
        />
      )}
    </>
  );
}

/* ── Location Panel (SSE — admin view) ───────────────────────────────────── */

function LocationPanel({ deliveryId, trackingCode }: { deliveryId: string; trackingCode: string }) {
  const [loc, setLoc]             = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [connected, setConnected] = useState(false);
  const [secsAgo, setSecsAgo]     = useState(0);
  const lastUpdateRef             = useRef<Date | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/location/stream/${deliveryId}`);
    es.onmessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as { lat?: number | null; lng?: number; accuracy?: number | null };
      setConnected(true);
      if (data.lat != null && data.lng != null) {
        setLoc({ lat: data.lat, lng: data.lng, accuracy: data.accuracy ?? null });
        lastUpdateRef.current = new Date();
        setSecsAgo(0);
      }
    };
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, [deliveryId]);

  useEffect(() => {
    const t = setInterval(() => {
      if (lastUpdateRef.current)
        setSecsAgo(Math.floor((Date.now() - lastUpdateRef.current.getTime()) / 1000));
    }, 1_000);
    return () => clearInterval(t);
  }, []);

  const isLive  = connected && !!loc && secsAgo < 60;
  const isStale = !!loc && secsAgo >= 60;

  return (
    <Section title="Live Location">
      {!loc ? (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className={cn(
              "h-2 w-2 rounded-full shrink-0 mt-1.5",
              connected ? "bg-amber-400 animate-pulse" : "bg-slate-300"
            )} />
            <div>
              <p className="text-xs font-semibold text-slate-600">
                {connected ? "Driver GPS not yet active" : "Connecting…"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {connected
                  ? "The driver needs to open the Driver Portal and start GPS tracking."
                  : "Establishing connection to location stream…"}
              </p>
            </div>
          </div>
          {connected && (
            <a
              href={`/dashboard/driver/deliveries/${deliveryId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-cf-primary/30 bg-cf-primary/5 px-3 py-2 text-xs font-semibold text-cf-primary hover:bg-cf-primary/10 transition-colors"
            >
              <IconTruck className="h-3.5 w-3.5" stroke={2} />
              Open Driver View for {trackingCode}
            </a>
          )}
        </div>
      ) : (
        <div className={cn(
          "rounded-xl border overflow-hidden",
          isLive ? "border-green-200" : "border-amber-200"
        )}>
          {/* Color header */}
          <div className={cn("px-3.5 py-2 flex items-center justify-between",
            isLive ? "bg-green-600" : "bg-amber-500")}>
            <div className="flex items-center gap-2">
              {isLive ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
              ) : (
                <div className="h-2 w-2 rounded-full bg-white/70" />
              )}
              <span className="text-white text-xs font-bold tracking-wide">
                {isLive ? "LIVE" : isStale
                  ? `LAST SEEN ${secsAgo < 3600 ? Math.floor(secsAgo / 60) + "m" : Math.floor(secsAgo / 3600) + "h"} AGO`
                  : "UPDATING…"}
              </span>
            </div>
            <a
              href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:text-white text-xs font-semibold transition-colors"
            >
              Open Maps →
            </a>
          </div>
          {/* Coordinates */}
          <div className={cn("px-3.5 py-3", isLive ? "bg-green-50" : "bg-amber-50")}>
            <p className="font-mono text-sm font-bold text-slate-800 tabular-nums">
              {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
            </p>
            {loc.accuracy != null && (
              <p className="text-[11px] text-slate-500 mt-0.5">±{Math.round(loc.accuracy)}m accuracy</p>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}

/* ── Proof of Delivery Panel ─────────────────────────────────────────────── */

type PodData = {
  id:            string;
  recipientName: string | null;
  notes:         string | null;
  latitude:      number | null;
  longitude:     number | null;
  photoUrl:      string | null;
  signatureUrl:  string | null;
  createdAt:     string;
};

function PodPanel({ deliveryId }: { deliveryId: string }) {
  const [pod,     setPod]     = useState<PodData | null | "loading" | "none">("loading");

  useEffect(() => {
    fetch(`/api/deliveries/${deliveryId}/proof`)
      .then(r => r.ok ? r.json() as Promise<PodData | null> : null)
      .then(data => setPod(data ?? "none"))
      .catch(() => setPod("none"));
  }, [deliveryId]);

  if (pod === "loading") {
    return (
      <Section title="Proof of Delivery">
        <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
      </Section>
    );
  }

  if (pod === "none" || !pod) {
    return (
      <Section title="Proof of Delivery">
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <IconClipboardCheck className="h-4 w-4 text-slate-300 shrink-0" />
          <p className="text-xs text-slate-400">No proof of delivery recorded</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Proof of Delivery">
      <div className="rounded-xl border border-green-200 bg-green-50 overflow-hidden">
        <div className="flex items-center gap-2 bg-green-600 px-4 py-2.5">
          <IconClipboardCheck className="h-4 w-4 text-white shrink-0" strokeWidth={2} />
          <p className="text-white text-xs font-bold tracking-wide">DELIVERY CONFIRMED</p>
        </div>
        <div className="px-4 py-3.5 space-y-2.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-700/60 mb-0.5">Received by</p>
            <p className="text-sm font-bold text-slate-800">{pod.recipientName ?? "—"}</p>
          </div>
          {/* Photo */}
          {pod.photoUrl && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-700/60 mb-1.5">Photo</p>
              <a href={pod.photoUrl} target="_blank" rel="noopener noreferrer"
                className="block rounded-xl overflow-hidden border border-green-200 hover:opacity-90 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pod.photoUrl} alt="Delivery proof" className="w-full max-h-48 object-cover" />
              </a>
            </div>
          )}

          {/* Signature */}
          {pod.signatureUrl && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-700/60 mb-1.5">Signature</p>
              <div className="rounded-xl overflow-hidden border border-green-200 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pod.signatureUrl} alt="Recipient signature" className="w-full max-h-24 object-contain" />
              </div>
            </div>
          )}

          {pod.notes && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-700/60 mb-0.5">Notes</p>
              <p className="text-sm text-slate-700 leading-relaxed">{pod.notes}</p>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-green-200/60">
            <p className="text-[11px] text-slate-500">
              {new Date(pod.createdAt).toLocaleDateString("en-TZ", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
            {pod.latitude && pod.longitude && (
              <a
                href={`https://maps.google.com/?q=${pod.latitude},${pod.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-green-700 hover:underline flex items-center gap-1"
              >
                <IconMapPin className="h-3 w-3" /> View location
              </a>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── Payment Panel ───────────────────────────────────────────────────────── */

import type { PaymentMethod, PaymentStatus } from "@/lib/generated/prisma/client";

type PaymentState = {
  status:        PaymentStatus;
  method:        PaymentMethod;
  amount:        string | null;
  phoneNumber:   string | null;
  paidAt:        string | null;
  mpesaCode:     string | null;
  failureReason: string | null;
} | null;

const METHOD_LABELS: Record<string, string> = {
  TIGOPESA:      "Tigo Pesa",
  AIRTEL_MONEY:  "Airtel Money",
  MPESA:         "M-Pesa (Vodacom)",
  CASH:          "Cash",
  BANK_TRANSFER: "Bank Transfer",
};

/* Auto-detect Tanzania MNO from phone prefix.
   Normalises +255712... / 255712... / 0712... → 3-digit code after leading 0 */
function detectMno(phone: string): PaymentMethod | null {
  const digits = phone.replace(/^\+255/, "0").replace(/^255/, "0").replace(/\D/g, "");
  if (!digits.startsWith("0") || digits.length < 6) return null;
  const p = parseInt(digits.slice(1, 4), 10); // e.g. "0712..." → 712
  if (p >= 740 && p <= 769) return "MPESA";          // Vodacom/M-Pesa: 074x–076x
  if ((p >= 710 && p <= 719) || (p >= 650 && p <= 659) || (p >= 670 && p <= 679)) return "TIGOPESA"; // Tigo
  if ((p >= 680 && p <= 689) || (p >= 690 && p <= 699) || (p >= 780 && p <= 789)) return "AIRTEL_MONEY"; // Airtel
  return null;
}

function PaymentPanel({
  deliveryId,
  fee,
  recipientPhone,
  initialPayment,
  onPaid,
}: {
  deliveryId:     string;
  fee:            string;
  recipientPhone: string;
  initialPayment: PaymentState;
  onPaid:         (p: PaymentState) => void;
}) {
  const [payment, setPayment] = useState<PaymentState>(initialPayment);
  const [phone,   setPhone]   = useState(recipientPhone);
  const [method,  setMethod]  = useState<PaymentMethod>(
    () => detectMno(recipientPhone) ?? "TIGOPESA"
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  /* Auto-detect MNO as user types */
  function handlePhoneChange(val: string) {
    setPhone(val);
    const detected = detectMno(val);
    if (detected) setMethod(detected);
  }

  /* Poll for status change while PENDING */
  useEffect(() => {
    if (payment?.status !== "PENDING") return;
    const t = setInterval(async () => {
      try {
        const res  = await fetch(`/api/payments/${deliveryId}`);
        if (!res.ok) return;
        const data = await res.json() as PaymentState | null;
        if (data && data.status !== "PENDING") {
          setPayment(data);
          onPaid(data);
          clearInterval(t);
        }
      } catch { /* ignore network blips */ }
    }, 5_000);
    return () => clearInterval(t);
  }, [payment?.status, deliveryId, onPaid]);

  async function requestPayment() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ deliveryId, phoneNumber: phone, method }),
      });
      let data: { error?: string } = {};
      try { data = await res.json() as { error?: string }; } catch { /* non-JSON */ }
      if (!res.ok) { setError(data.error ?? `Server error (${res.status})`); return; }
      setPayment({ status: "PENDING", method, amount: null, phoneNumber: phone, paidAt: null, mpesaCode: null, failureReason: null });
      toast.success("Payment request sent — customer will receive USSD prompt");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function manualAction(action: "mark_paid" | "cancel") {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/payments/${deliveryId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      const data = await res.json() as PaymentState & { error?: string } | null;
      if (!res.ok) { setError((data as { error?: string })?.error ?? `Error (${res.status})`); return; }
      setPayment(data as PaymentState);
      onPaid(data as PaymentState);
      toast.success(action === "mark_paid" ? "Payment marked as paid" : "Payment request cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  /* ── PAID — receipt view ── */
  if (payment?.status === "PAID") {
    return (
      <Section title="Payment">
        <div className="rounded-xl border border-green-200 bg-green-50 overflow-hidden">
          <div className="flex items-center justify-between gap-2 bg-green-600 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <IconCircleCheck className="h-4 w-4 text-white shrink-0" strokeWidth={2} />
              <p className="text-white text-xs font-bold tracking-wide">PAYMENT RECEIVED</p>
            </div>
            {payment.paidAt && (
              <p className="text-white/80 text-[10px] font-medium">
                {new Date(payment.paidAt).toLocaleDateString("en-TZ", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <div className="px-4 py-3.5 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold text-slate-800">{formatTZS(fee)}</p>
              <span className="text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2.5 py-0.5">
                {METHOD_LABELS[payment.method] ?? payment.method}
              </span>
            </div>
            {payment.phoneNumber && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <IconPhone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>{payment.phoneNumber}</span>
              </div>
            )}
            {payment.mpesaCode && (
              <div className="flex items-center gap-2 rounded-lg bg-green-100/60 border border-green-200 px-3 py-2">
                <IconCheck className="h-3.5 w-3.5 text-green-700 shrink-0" strokeWidth={2.5} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-700/60">Transaction Ref</p>
                  <p className="text-xs font-mono font-bold text-green-800">{payment.mpesaCode}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>
    );
  }

  /* ── PENDING — awaiting USSD confirmation ── */
  if (payment?.status === "PENDING") {
    return (
      <Section title="Payment">
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="flex items-center gap-2 bg-amber-500 px-4 py-2.5">
            <IconLoader2 className="h-4 w-4 text-white animate-spin shrink-0" strokeWidth={2} />
            <p className="text-white text-xs font-bold tracking-wide">AWAITING CONFIRMATION</p>
          </div>
          <div className="px-4 py-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {formatTZS(fee)} via {METHOD_LABELS[payment.method] ?? payment.method}
                </p>
                {payment.phoneNumber && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <IconPhone className="h-3 w-3" />
                    {payment.phoneNumber}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-100 rounded-full px-2.5 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                </span>
                <p className="text-[10px] font-bold">Checking…</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Customer received a USSD prompt — auto-updates every 5 seconds
            </p>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200">
              <button
                onClick={() => manualAction("mark_paid")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" /> : <IconCircleCheck className="h-3.5 w-3.5" strokeWidth={2} />}
                Mark as Paid
              </button>
              <button
                onClick={() => manualAction("cancel")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <IconCircleX className="h-3.5 w-3.5" strokeWidth={2} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Section>
    );
  }

  /* ── FAILED or no payment — request form ── */
  return (
    <Section title="Payment">
      <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cf-primary/10">
            <IconCurrencyDollar className="h-4 w-4 text-cf-primary" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-700">{formatTZS(fee)}</p>
            <p className="text-xs text-slate-400">
              {payment?.status === "FAILED" ? "Previous request failed — retry below" : "Collect via mobile money"}
            </p>
          </div>
        </div>

        {/* Failure reason banner */}
        {payment?.status === "FAILED" && payment.failureReason && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border-b border-red-100">
            <IconCircleX className="h-4 w-4 text-red-500 shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-xs text-red-700 leading-relaxed">{payment.failureReason}</p>
          </div>
        )}

        <div className="px-4 py-4 space-y-3">
          {/* Phone */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Payer Phone
            </label>
            <div className="relative">
              <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="255712345678"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cf-primary/30 focus:border-cf-primary transition-colors bg-white"
              />
            </div>
          </div>

          {/* Network */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Network
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["TIGOPESA", "AIRTEL_MONEY", "MPESA"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    "rounded-lg border py-2 text-xs font-semibold transition-all",
                    method === m
                      ? "border-cf-primary bg-cf-primary text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-cf-primary/40",
                  )}
                >
                  {m === "TIGOPESA" ? "Tigo Pesa" : m === "AIRTEL_MONEY" ? "Airtel" : "M-Pesa"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={requestPayment}
            disabled={loading || !phone.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-cf-primary py-2.5 text-sm font-bold text-white hover:bg-cf-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <><IconLoader2 className="h-4 w-4 animate-spin" /> Sending…</>
            ) : payment?.status === "FAILED" ? (
              <><IconRefresh className="h-4 w-4" strokeWidth={2} /> Retry Payment</>
            ) : (
              <><IconCurrencyDollar className="h-4 w-4" /> Request Payment</>
            )}
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ── SMS History Panel ───────────────────────────────────────────────────── */

type SmsLog = {
  id: string;
  recipient: string;
  message: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED";
  cost: string | null;
  createdAt: string;
  sentAt: string | null;
};

function SmsPanel({ deliveryId }: { deliveryId: string }) {
  const [logs, setLogs] = useState<SmsLog[] | null | "loading">("loading");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function loadLogs() {
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/sms`);
      if (res.ok) {
        const { data } = await res.json();
        setLogs(data);
      } else {
        setLogs(null);
      }
    } catch {
      setLogs(null);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [deliveryId]);

  async function handleRetry(smsId: string) {
    setRetryingId(smsId);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/sms/${smsId}/retry`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("SMS sent successfully!");
        loadLogs();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to resend SMS");
        loadLogs();
      }
    } catch {
      toast.error("Network error while resending SMS");
    } finally {
      setRetryingId(null);
    }
  }

  if (logs === "loading") {
    return (
      <Section title="SMS Logs">
        <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
      </Section>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Section title="SMS Logs">
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <IconMessage className="h-4 w-4 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-500 font-medium">Hakuna SMS yoyote iliyotumwa bado</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="SMS Logs">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 border-b border-slate-200">
          <div className="bg-cf-primary/10 p-1.5 rounded-lg">
            <IconHistory className="h-4 w-4 text-cf-primary shrink-0" strokeWidth={2} />
          </div>
          <p className="text-slate-700 text-xs font-bold tracking-wide">HISTORIA YA MESEJI</p>
        </div>
        {(logs as SmsLog[]).map((log) => {
          const isFailed = log.status === "FAILED";
          const isSent = log.status === "SENT" || log.status === "DELIVERED";
          return (
            <div key={log.id} className={cn("p-4 transition-colors", isFailed ? "bg-red-50/50" : "")}>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full shadow-sm border",
                    isSent ? "bg-emerald-100 text-emerald-600 border-emerald-200" :
                    isFailed ? "bg-red-100 text-red-600 border-red-200" :
                    "bg-amber-100 text-amber-600 border-amber-200"
                  )}>
                    {isSent ? <IconCheck className="h-4 w-4" stroke={2.5} /> :
                     isFailed ? <IconX className="h-4 w-4" stroke={2.5} /> :
                     <IconClock className="h-4 w-4 animate-pulse" stroke={2.5} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold font-mono text-slate-700 block">{log.recipient}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest mt-0.5 block",
                      isSent ? "text-emerald-600" : isFailed ? "text-red-600" : "text-amber-600"
                    )}>
                      {isSent ? "IMEFANIKIWA" : isFailed ? "IMEFELI" : "INASUBIRI"}
                    </span>
                  </div>
                </div>
                {isFailed && (
                  <button
                    onClick={() => handleRetry(log.id)}
                    disabled={retryingId === log.id}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {retryingId === log.id ? (
                      <><IconLoader2 className="h-3 w-3 animate-spin" /> Inatuma</>
                    ) : (
                      <><IconSend className="h-3 w-3" /> Tuma Tena</>
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3 bg-slate-50/80 rounded-xl p-3 border border-slate-100 shadow-sm relative">
                <span className="absolute -left-1.5 top-3 w-3 h-3 bg-slate-50 border-l border-b border-slate-100 rotate-45" />
                <span className="relative z-10">{log.message}</span>
              </p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <IconCalendar className="h-3 w-3" />
                  {new Date(log.createdAt).toLocaleDateString("en-TZ", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
                {log.cost && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shadow-sm flex items-center gap-1">
                    <IconCurrencyDollar className="h-3 w-3" />
                    Gharama: TZS {log.cost}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
