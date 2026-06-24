"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconArrowLeft, IconMapPin, IconNavigation, IconX,
  IconAlertTriangle, IconWifiOff, IconRefresh, IconCheck,
  IconSatellite, IconCloudUpload, IconPhone, IconAlertOctagon,
  IconClipboardCheck, IconUser, IconCamera, IconTrash,
  IconPackage, IconBrandWhatsapp,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

/* ── Types ───────────────────────────────────────────────────────────────── */

type GpsStatus = "idle" | "acquiring" | "active" | "denied" | "unavailable" | "timeout";

type DeliveryData = {
  id: string;
  trackingCode: string;
  status: string;
  priority: string;
  pickupAddress: string;
  deliveryAddress: string;
  city: string | null;
  recipientName: string;
  recipientPhone: string;
  senderName: string;
  senderPhone: string;
  notes: string | null;
  fee: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  driver: { id: string; name: string | null; phone: string | null } | null;
};

/* ── Image compression (browser Canvas API) ─────────────────────────────── */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY  = 0.82;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) { height = Math.round(height * MAX_DIMENSION / width);  width  = MAX_DIMENSION; }
        else                 { width  = Math.round(width  * MAX_DIMENSION / height); height = MAX_DIMENSION; }
      }
      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", JPEG_QUALITY);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/* ── Upload phase & retry ────────────────────────────────────────────────── */

type UploadPhase = "uploading" | "saving" | "done";

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise<void>(r => setTimeout(r, 1200 * (i + 1)));
    }
  }
  throw lastErr;
}

/* XHR upload with real byte-level progress (0–100) */
function uploadWithProgress(
  url:        string,
  form:       FormData,
  onProgress: (pct: number) => void,
): Promise<{ photoKey?: string; signatureKey?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText) as { photoKey?: string; signatureKey?: string }); }
        catch { reject(new Error("Invalid server response")); }
      } else {
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(body.error ?? `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
    xhr.send(form);
  });
}

/* ── Config ──────────────────────────────────────────────────────────────── */

const TRANSITIONS: Partial<Record<string, { status: string; label: string }[]>> = {
  ASSIGNED:   [{ status: "PICKED_UP",  label: "Mark as Picked Up" }],
  PICKED_UP:  [{ status: "IN_TRANSIT", label: "Start Transit"     }],
  IN_TRANSIT: [{ status: "DELIVERED",  label: "Mark as Delivered" }],
};

const STATUS_BADGE: Record<string, string> = {
  ASSIGNED:   "bg-blue-100   text-blue-700",
  PICKED_UP:  "bg-amber-100  text-amber-700",
  IN_TRANSIT: "bg-orange-100 text-orange-700",
  DELIVERED:  "bg-green-100  text-green-700",
  CANCELLED:  "bg-slate-100  text-slate-500",
};

const GPS_STATUSES  = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"];
const STALE_S       = 60;
const SEND_INTERVAL = 15_000;

/* ── Offline GPS queue (localStorage) ───────────────────────────────────── */

type OfflinePoint = {
  lat:      number;
  lng:      number;
  accuracy: number | null;
  queuedAt: string;
};

function queueKey(id: string) { return `cf:gps:${id}`; }

function getQueue(deliveryId: string): OfflinePoint[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(queueKey(deliveryId)) ?? "[]") as OfflinePoint[]; }
  catch { return []; }
}

function enqueuePoint(deliveryId: string, lat: number, lng: number, accuracy: number | null) {
  if (typeof window === "undefined") return;
  try {
    const q = getQueue(deliveryId);
    q.push({ lat, lng, accuracy, queuedAt: new Date().toISOString() });
    if (q.length > 200) q.splice(0, 200); // cap at ~50 min of history
    localStorage.setItem(queueKey(deliveryId), JSON.stringify(q));
  } catch { /* storage full */ }
}

function saveQueue(deliveryId: string, q: OfflinePoint[]) {
  if (typeof window === "undefined") return;
  if (q.length === 0) { localStorage.removeItem(queueKey(deliveryId)); return; }
  localStorage.setItem(queueKey(deliveryId), JSON.stringify(q));
}

/* ── Main component ──────────────────────────────────────────────────────── */

export function DriverDeliveryPage({
  delivery: initial,
  orgPhone,
  orgName,
}: {
  delivery:  DeliveryData;
  orgPhone:  string | null;
  orgName:   string;
}) {
  const { t } = useLanguage();
  const dPortal = t.driverPortal;

  const [delivery, setDelivery]           = useState(initial);
  const [gpsStatus, setGpsStatus]         = useState<GpsStatus>("idle");
  const [coords, setCoords]               = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [lastSentAt, setLastSentAt]       = useState<Date | null>(null);
  const [secsAgo, setSecsAgo]             = useState(0);
  const [consecutiveErrors, setConErrors] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showPodModal,  setShowPodModal]  = useState(false);
  const [submitError,   setSubmitError]  = useState<string | null>(null);
  const [uploadPhase,    setUploadPhase]   = useState<UploadPhase | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showIssueModal, setShowIssueModal] = useState(false);

  /* ── New: online / offline / queue state ─────────────────────────────── */
  const [isOnline, setIsOnline]           = useState(true);   // SSR-safe default
  const [offlineQueue, setOfflineQueue]   = useState(0);
  const [isFlushing, setIsFlushing]       = useState(false);
  const [rejectedCount, setRejectedCount] = useState(0);

  const watchIdRef      = useRef<number | null>(null);
  const lastSentTimeRef = useRef<number>(0);
  const isFlushingRef   = useRef(false);

  /* Sync isOnline + queue count from actual browser state on mount */
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setOfflineQueue(getQueue(initial.id).length);
  }, [initial.id]);

  /* Live "X seconds ago" ticker */
  useEffect(() => {
    const t = setInterval(() => {
      if (lastSentAt) setSecsAgo(Math.floor((Date.now() - lastSentAt.getTime()) / 1000));
    }, 1_000);
    return () => clearInterval(t);
  }, [lastSentAt]);

  /* Cleanup watchPosition on unmount */
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  /* ── Offline queue flush ─────────────────────────────────────────────── */

  const flushQueue = useCallback(async () => {
    if (isFlushingRef.current) return;
    const queue = getQueue(initial.id);
    if (queue.length === 0) return;

    isFlushingRef.current = true;
    setIsFlushing(true);

    let sent = 0;
    for (const point of queue) {
      try {
        const res = await fetch("/api/location", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            deliveryId: initial.id,
            lat:        point.lat,
            lng:        point.lng,
            accuracy:   point.accuracy,
            offline:    true,
            queuedAt:   point.queuedAt,
          }),
        });
        /* 422 = validation error for this point — skip it and continue */
        if (res.ok || res.status === 422) { sent++; continue; }
        break; // server/network error — stop and retry later
      } catch {
        break;
      }
    }

    const remaining = queue.slice(sent);
    saveQueue(initial.id, remaining);
    setOfflineQueue(remaining.length);
    if (sent > 0) setLastSentAt(new Date());
    if (sent > 1) toast.success(`${sent} GPS ${sent === 1 ? "point" : "points"} synced from offline queue ✓`);

    isFlushingRef.current = false;
    setIsFlushing(false);
  }, [initial.id]);

  /* Online/offline event listeners */
  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  void flushQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushQueue]);

  /* ── Auto-start GPS ── */
  useEffect(() => {
    if (["PICKED_UP", "IN_TRANSIT"].includes(delivery.status) && watchIdRef.current === null) {
      startGps();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery.status]);

  /* ── GPS send (with offline fallback) ───────────────────────────────── */

  async function sendLocation(lat: number, lng: number, accuracy: number | null) {
    /* Offline — enqueue immediately, no network call */
    if (!isOnline) {
      enqueuePoint(delivery.id, lat, lng, accuracy);
      setOfflineQueue(getQueue(delivery.id).length);
      return;
    }

    try {
      const res = await fetch("/api/location", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ deliveryId: delivery.id, lat, lng, accuracy }),
      });

      if (res.ok) {
        setLastSentAt(new Date());
        setConErrors(0);
        return;
      }

      if (res.status === 422) {
        const data = await res.json() as { code?: string };
        if (data.code === "IMPOSSIBLE_SPEED") {
          setRejectedCount((n) => n + 1);
          toast.error(
            "Location rejected — GPS jumped too far. Signal may be unstable.",
            { duration: 6_000 }
          );
          return;
        }
        if (data.code === "MOCK_GPS") {
          toast.error("GPS error — please disable any mock location apps.", { duration: 8_000 });
          return;
        }
        /* Other validation error — don't enqueue */
        return;
      }

      /* Server error (5xx) or delivery inactive (404) — enqueue if eligible */
      if (res.status !== 404) {
        enqueuePoint(delivery.id, lat, lng, accuracy);
        setOfflineQueue(getQueue(delivery.id).length);
      }
      setConErrors((n) => n + 1);
    } catch {
      /* Network error — enqueue for later sync */
      enqueuePoint(delivery.id, lat, lng, accuracy);
      setOfflineQueue(getQueue(delivery.id).length);
      setConErrors((n) => n + 1);
    }
  }

  /* ── GPS control ─────────────────────────────────────────────────────── */

  function startGps() {
    if (!navigator.geolocation) { setGpsStatus("unavailable"); return; }
    setGpsStatus("acquiring");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setCoords({ lat, lng, accuracy });
        setGpsStatus("active");

        const now = Date.now();
        if (now - lastSentTimeRef.current >= SEND_INTERVAL) {
          lastSentTimeRef.current = now;
          void sendLocation(lat, lng, accuracy);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED)    setGpsStatus("denied");
        if (err.code === err.POSITION_UNAVAILABLE) setGpsStatus("unavailable");
        if (err.code === err.TIMEOUT)              setGpsStatus("timeout");
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 10_000 }
    );
  }

  function stopGps() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsStatus("idle");
    setCoords(null);
    setLastSentAt(null);
    setSecsAgo(0);
    setConErrors(0);
    setRejectedCount(0);
  }

  /* ── SOS ─────────────────────────────────────────────────────────────── */

  async function sendSos(): Promise<{ smsSent: boolean; orgPhone: string | null }> {
    const res = await fetch("/api/driver/sos", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        deliveryId: delivery.id,
        lat:        coords?.lat,
        lng:        coords?.lng,
      }),
    });
    if (res.ok) {
      const data = await res.json() as { smsSent: boolean; orgPhone: string | null };
      return data;
    }
    throw new Error("SOS request failed");
  }

  /* ── Status update ───────────────────────────────────────────────────── */

  async function changeStatus(newStatus: string, notes?: string) {
    /* Intercept DELIVERED — show PoD modal instead */
    if (newStatus === "DELIVERED") { setShowPodModal(true); return; }

    setStatusLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${delivery.id}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus, ...(notes && { notes }) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error ?? "Status change failed");
        return;
      }
      const updated = await res.json() as Partial<DeliveryData>;
      setDelivery((d) => ({ ...d, ...updated }));
      toast.success(`Updated to ${newStatus.replace("_", " ").toLowerCase()}`);
      if (newStatus === "PICKED_UP" && gpsStatus === "idle") startGps();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setStatusLoading(false);
    }
  }

  async function submitPod(
    recipientName: string,
    notes:         string,
    photo:         Blob | null,   // already compressed inside PodModal
    signatureBlob: Blob | null,
  ) {
    setUploadPhase("uploading");
    setUploadProgress(0);
    setSubmitError(null);
    try {
      /* 1 — Upload files through our server (avoids R2 CORS entirely) */
      let photoKey:     string | null = null;
      let signatureKey: string | null = null;

      if (photo || signatureBlob) {
        const form = new FormData();
        if (photo)         form.append("photo",     new File([photo],         "photo.jpg",     { type: "image/jpeg" }));
        if (signatureBlob) form.append("signature", new File([signatureBlob], "signature.png", { type: "image/png"  }));

        /* XHR gives real byte progress; withRetry resets % on each attempt */
        await withRetry(async () => {
          setUploadProgress(0);
          const keys = await uploadWithProgress(
            `/api/deliveries/${delivery.id}/proof/upload`,
            form,
            setUploadProgress,
          );
          photoKey     = keys.photoKey     ?? null;
          signatureKey = keys.signatureKey ?? null;
        });
      }

      /* 2 — Commit PoD metadata (marks delivery DELIVERED atomically) */
      setUploadPhase("saving");

      await withRetry(async () => {
        const res = await fetch(`/api/deliveries/${delivery.id}/proof`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            recipientName,
            ...(notes        && { notes }),
            ...(coords?.lat  !== undefined && { lat: coords.lat }),
            ...(coords?.lng  !== undefined && { lng: coords.lng }),
            ...(photoKey     && { photoKey }),
            ...(signatureKey && { signatureKey }),
          }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error((e as { error?: string }).error ?? "Could not save proof");
        }
      });

      /* 3 — Show success screen for 2 s then close */
      setUploadPhase("done");
      setDelivery((d) => ({ ...d, status: "DELIVERED" }));
      stopGps();
      setTimeout(() => {
        setShowPodModal(false);
        setUploadPhase(null);
        toast.success("Delivery confirmed — Proof of Delivery saved ✓");
      }, 2000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed — please try again";
      setSubmitError(msg);
      setUploadPhase(null);
    }
  }

  /* ── Derived state ───────────────────────────────────────────────────── */

  const transitions    = TRANSITIONS[delivery.status] ?? [];
  const isTerminal     = ["DELIVERED", "FAILED", "CANCELLED"].includes(delivery.status);

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard/driver"
            className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors text-slate-500">
            <IconArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">Delivery</p>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-base font-bold text-slate-800 truncate">{delivery.trackingCode}</h1>
              {gpsStatus === "active" && (
                <div title="GPS Tracking Active" className="flex items-center justify-center h-4 w-4 rounded-full bg-green-50 ring-1 ring-green-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                </div>
              )}
            </div>
          </div>
          <span className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            STATUS_BADGE[delivery.status] ?? "bg-slate-100 text-slate-600"
          )}>
            {delivery.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Route card */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Delivery Route</p>

          <div className="relative">
            <div className="absolute left-[10px] top-[14px] h-[calc(100%-28px)] w-px bg-slate-200 z-0" />
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="relative z-10 mt-1 h-5 w-5 shrink-0 flex items-center justify-center rounded-full border-2 border-cf-primary bg-white">
                  <div className="h-2 w-2 rounded-full bg-cf-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Pickup</p>
                  <p className="text-sm font-semibold text-slate-700">{delivery.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center text-cf-primary">
                  <IconMapPin className="h-5 w-5" stroke={2} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Drop-off</p>
                  <p className="text-sm font-semibold text-slate-700">{delivery.deliveryAddress}</p>
                  {delivery.city && <p className="text-xs text-slate-400 mt-0.5">{delivery.city}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Recipient</p>
            <p className="text-sm font-semibold text-slate-700">{delivery.recipientName}</p>
            <p className="text-sm text-slate-500 mb-2">{delivery.recipientPhone}</p>
            
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a href={`tel:${delivery.recipientPhone}`} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-700 px-3 py-2 text-xs font-bold ring-1 ring-emerald-200 hover:bg-emerald-100 transition-colors">
                <IconPhone className="h-4 w-4" /> {dPortal.details.call}
              </a>
              <a href={`https://wa.me/${delivery.recipientPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg bg-[#E7F8F0] text-[#0A8043] px-3 py-2 text-xs font-bold ring-1 ring-[#0A8043]/20 hover:bg-[#D1F1DF] transition-colors">
                <IconBrandWhatsapp className="h-4 w-4" /> {dPortal.details.whatsapp}
              </a>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(delivery.deliveryAddress)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-700 px-3 py-2 text-xs font-bold ring-1 ring-blue-200 hover:bg-blue-100 transition-colors">
                <IconNavigation className="h-4 w-4" /> {dPortal.details.navigate}
              </a>
            </div>
          </div>

          {delivery.notes && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Driver Notes</p>
              <p className="text-sm text-slate-600 leading-relaxed bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-100">
                {delivery.notes}
              </p>
            </div>
          )}
        </div>

        {/* Status update */}
        {transitions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Update Status</p>
            {transitions.map(({ status, label }) => (
              <button
                key={status}
                disabled={statusLoading}
                onClick={() => changeStatus(status)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cf-primary text-white font-bold py-4 text-sm hover:bg-cf-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
              >
                {statusLoading ? "Updating…" : <><IconCheck className="h-4 w-4" strokeWidth={3} />{label}</>}
              </button>
            ))}
            
            <button
              disabled={statusLoading}
              onClick={() => setShowIssueModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-600 font-bold py-3.5 text-sm ring-1 ring-red-200 hover:bg-red-100 active:scale-[0.98] transition-all shadow-sm mt-3"
            >
              <IconAlertTriangle className="h-4 w-4" strokeWidth={2.5} />
              {dPortal.details.reportIssue}
            </button>
          </div>
        )}

        {isTerminal && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto mb-3">
              <IconCheck className="h-6 w-6 text-green-600" strokeWidth={2.5} />
            </div>
            <p className="font-bold text-green-700">Delivery Complete</p>
            <p className="text-sm text-green-600 mt-0.5">
              {delivery.status === "DELIVERED" ? "Marked as delivered successfully" : delivery.status.toLowerCase()}
            </p>
          </div>
        )}

      </div>

      {/* ── Proof of Delivery Modal ── */}
      {showPodModal && (
        <PodModal
          recipientName={delivery.recipientName}
          uploadPhase={uploadPhase}
          uploadProgress={uploadProgress}
          error={submitError}
          onConfirm={(name, notes, photo, sig) => void submitPod(name, notes, photo, sig)}
          onCancel={() => { setShowPodModal(false); setSubmitError(null); setUploadPhase(null); setUploadProgress(0); }}
        />
      )}

      {/* ── Issue Modal ── */}
      {showIssueModal && (
        <IssueModal
          onConfirm={(reason, notes) => {
            setShowIssueModal(false);
            void changeStatus("FAILED", `${reason}${notes ? ` - ${notes}` : ""}`);
          }}
          onCancel={() => setShowIssueModal(false)}
        />
      )}
    </div>
  );
}

/* ── Proof of Delivery Modal ─────────────────────────────────────────────── */

function formatSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

function StepLabel({ n, label, optional }: { n: number; label: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 mb-2.5">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-white text-[10px] font-black">
        {n}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
        {label}
        {optional && <span className="ml-1.5 font-semibold text-slate-300 normal-case tracking-normal">— optional</span>}
      </p>
    </div>
  );
}

function PodModal({
  recipientName: defaultName,
  uploadPhase,
  uploadProgress,
  error,
  onConfirm,
  onCancel,
}: {
  recipientName:  string;
  uploadPhase:    UploadPhase | null;
  uploadProgress: number;
  error:          string | null;
  onConfirm:      (name: string, notes: string, photo: Blob | null, signature: Blob | null) => void;
  onCancel:       () => void;
}) {
  const [name,            setName]            = useState(defaultName);
  const [notes,           setNotes]           = useState("");
  const [compressedPhoto, setCompressedPhoto] = useState<Blob | null>(null);
  const [preview,         setPreview]         = useState<string | null>(null);
  const [isCompressing,   setIsCompressing]   = useState(false);
  const [originalKB,      setOriginalKB]      = useState<number | null>(null);
  const [compressedKB,    setCompressedKB]    = useState<number | null>(null);
  const [photoDims,       setPhotoDims]       = useState<{ w: number; h: number } | null>(null);
  const [signature,       setSignature]       = useState<Blob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadPhase !== null && uploadPhase !== "done";
  const isDone      = uploadPhase === "done";
  const hasSig      = signature !== null;
  const hasPhoto    = compressedPhoto !== null;
  const canSubmit   = name.trim().length > 0 && hasPhoto && !isCompressing && !isUploading && !isDone;

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setOriginalKB(Math.round(file.size / 1024));
    setCompressedKB(null);
    setCompressedPhoto(null);
    setIsCompressing(true);
    compressImage(file).then(blob => {
      setCompressedPhoto(blob);
      setCompressedKB(Math.round(blob.size / 1024));
      /* Read final dimensions from the compressed blob */
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { setPhotoDims({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = () => { URL.revokeObjectURL(url); };
      img.src = url;
      setIsCompressing(false);
    });
  }

  function removePhoto() {
    setCompressedPhoto(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setOriginalKB(null);
    setCompressedKB(null);
    setPhotoDims(null);
    setIsCompressing(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const checklist = [
    { label: "Recipient name", done: name.trim().length > 0, required: true },
    { label: "Photo",          done: hasPhoto,                required: true },
    { label: "Signature",      done: hasSig,                  required: false },
    { label: "Notes",          done: notes.trim().length > 0, required: false },
  ];

  const uploadSteps = [
    { phase: "uploading" as const, label: "Uploading files to server" },
    { phase: "saving"    as const, label: "Saving delivery record" },
  ];

  return (
    <div className="cf-dashboard fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

        {/* ── ④ Success overlay ── */}
        {isDone && (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10 rounded-2xl">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-100 animate-ping opacity-50" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <IconCheck className="h-11 w-11 text-green-600" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-800">Delivery Confirmed!</h3>
            <p className="mt-1 text-sm text-slate-500 text-center px-8">Proof of delivery saved successfully</p>
            <div className="mt-7 flex items-center gap-2 text-xs text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Closing automatically…
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="shrink-0 bg-green-600">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <IconClipboardCheck className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-white font-bold text-base leading-tight">Confirm Delivery</p>
                <p className="text-green-100 text-[11px] mt-0.5">Fill in the details to complete</p>
              </div>
            </div>
            <button onClick={onCancel} disabled={isUploading || isDone}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-40">
              <IconX className="h-4 w-4" />
            </button>
          </div>
          {/* Progress bar — fills as user completes form steps */}
          {(() => {
            const done = checklist.filter(c => c.done).length;
            const pct  = Math.round((done / checklist.length) * 100);
            return (
              <div className="h-1 bg-green-700/40">
                <div className="h-full bg-white/80 transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
              </div>
            );
          })()}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-5 space-y-6">

            {/* Step 1 — Received By */}
            <div>
              <StepLabel n={1} label="Received by" />
              <div className="relative">
                <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name of person who received"
                  disabled={isUploading}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 disabled:opacity-60",
                    name.trim()
                      ? "border-green-300 bg-green-50 focus:ring-green-200 focus:border-green-400"
                      : "border-slate-200 bg-white focus:ring-cf-primary/20 focus:border-cf-primary"
                  )}
                />
                {name.trim() && (
                  <IconCheck className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" strokeWidth={2.5} />
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 ml-0.5">Required to complete the delivery</p>
            </div>

            <div className="border-t border-slate-100" />

            {/* Step 2 — Photo */}
            <div>
              <StepLabel n={2} label="Delivery photo" />
              {preview ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border-2 border-green-300 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Delivery proof" className="w-full max-h-52 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isCompressing ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            <span className="text-white text-xs font-semibold">Compressing…</span>
                          </>
                        ) : (
                          <>
                            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                              <IconCheck className="h-3 w-3 text-white" strokeWidth={3} />
                            </div>
                            <span className="text-white text-xs font-bold">Photo ready</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => fileRef.current?.click()} disabled={isCompressing || isUploading}
                          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          <IconCamera className="h-3 w-3" /> Retake
                        </button>
                        <button onClick={removePhoto} disabled={isCompressing || isUploading}
                          className="flex items-center gap-1 bg-red-500/80 hover:bg-red-500 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          <IconTrash className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ② Photo details strip */}
                  {!isCompressing && compressedKB !== null && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 space-y-1.5">
                      {/* Top row: size saved */}
                      <div className="flex items-center gap-2">
                        <IconCheck className="h-3.5 w-3.5 text-green-600 shrink-0" strokeWidth={2.5} />
                        <p className="text-[11px] font-semibold text-green-700">
                          {originalKB !== null ? `${formatSize(originalKB)} → ` : ""}{formatSize(compressedKB)}
                          {originalKB !== null && originalKB > 0 && compressedKB < originalKB && (
                            <span className="ml-1 font-bold text-green-500">
                              ({Math.round((1 - compressedKB / originalKB) * 100)}% smaller)
                            </span>
                          )}
                        </p>
                      </div>
                      {/* Bottom row: format + dimensions */}
                      <div className="flex items-center gap-2 pl-5">
                        <span className="text-[10px] font-bold bg-green-200 text-green-800 rounded px-1.5 py-0.5 tracking-wide">
                          JPEG
                        </span>
                        {photoDims && (
                          <span className="text-[10px] font-semibold text-green-600">
                            {photoDims.w} × {photoDims.h} px
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* ② Photo guide */}
                  <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5">
                    <IconCamera className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <p className="text-[11px] font-bold text-amber-800">Good proof photo should show:</p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {([
                          { icon: IconPackage, label: "Package"   },
                          { icon: IconUser,    label: "Recipient" },
                          { icon: IconMapPin,  label: "Location"  },
                        ] as const).map(({ icon: Icon, label }) => (
                          <span key={label} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white border border-amber-200 rounded-full px-2 py-0.5 text-amber-700">
                            <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => fileRef.current?.click()} disabled={isUploading}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-7 hover:border-green-300 hover:bg-green-50/50 transition-all group disabled:opacity-60">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 group-hover:bg-green-100 transition-colors">
                      <IconCamera className="h-6 w-6 text-slate-400 group-hover:text-green-600 transition-colors" strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-600 group-hover:text-green-700 transition-colors">Take Photo</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Camera or gallery · auto-compressed</p>
                    </div>
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                capture="environment" className="hidden" onChange={handlePhoto} />
            </div>

            <div className="border-t border-slate-100" />

            {/* Step 3 — Signature */}
            <div>
              <StepLabel n={3} label="Recipient signature" optional />
              <SignaturePad onChange={setSignature} />
            </div>

            <div className="border-t border-slate-100" />

            {/* Step 4 — Notes */}
            <div>
              <StepLabel n={4} label="Notes" optional />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isUploading}
                placeholder="e.g. Left at front door, given to security guard…"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cf-primary/20 focus:border-cf-primary transition-colors disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* ── ① Upload progress steps (replaces footer while uploading) ── */}
        {isUploading && (
          <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saving proof…</p>
            <div className="space-y-3">
              {uploadSteps.map(({ phase, label }, i) => {
                const order   = uploadSteps.map(s => s.phase);
                const curIdx  = order.indexOf(uploadPhase!);
                const thisIdx = i;
                const done    = thisIdx < curIdx;
                const active  = thisIdx === curIdx;
                return (
                  <div key={phase}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        done   ? "bg-green-500"
                        : active ? "bg-green-600"
                        : "bg-slate-200"
                      )}>
                        {done
                          ? <IconCheck className="h-3 w-3 text-white" strokeWidth={3} />
                          : <span className={cn("text-[10px] font-black", active ? "text-white" : "text-slate-400")}>{i + 1}</span>
                        }
                      </div>
                      <p className={cn(
                        "text-sm font-semibold flex-1 transition-colors",
                        done   ? "text-green-600"
                        : active ? "text-slate-800"
                        : "text-slate-400"
                      )}>{label}</p>
                      {/* Spinner only for saving step; upload step shows % badge */}
                      {active && phase === "saving"    && <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />}
                      {active && phase === "uploading" && <span className="text-xs font-bold text-green-600 tabular-nums">{uploadProgress}%</span>}
                      {done   && phase === "uploading" && <span className="text-xs font-bold text-green-500">100%</span>}
                    </div>

                    {/* Real % progress bar — only for uploading step */}
                    {phase === "uploading" && (active || done) && (
                      <div className="ml-9 mt-2">
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-200 ease-out"
                            style={{
                              width: `${done ? 100 : uploadProgress}%`,
                              background: done
                                ? "#22c55e"
                                : "linear-gradient(90deg, #16a34a, #4ade80)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-center text-slate-400 pt-1">Please wait — do not close this window</p>
          </div>
        )}

        {/* ── Error banner ── */}
        {error && !isUploading && (
          <div className="mx-4 mb-2">
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <IconAlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-700">Upload failed</p>
                <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer (hidden while uploading or done) ── */}
        {!isUploading && !isDone && (
          <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
            {/* Checklist mini-summary */}
            <div className="flex items-center gap-2 flex-wrap">
              {checklist.map(({ label, done, required }) => (
                <div key={label} className={cn(
                  "flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5",
                  done      ? "bg-green-100 text-green-700"
                  : required ? "bg-red-50 text-red-500"
                  : "bg-slate-100 text-slate-400"
                )}>
                  {done
                    ? <IconCheck className="h-3 w-3" strokeWidth={3} />
                    : <span className="h-3 w-3 flex items-center justify-center">·</span>
                  }
                  {label}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={onCancel}
                disabled={isUploading}
                className="flex-[0_0_auto] w-24 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(name.trim(), notes.trim(), compressedPhoto, signature)}
                disabled={!canSubmit}
                className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
              >
                {isCompressing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing photo…
                  </>
                ) : error ? (
                  <><IconRefresh className="h-4 w-4" strokeWidth={2.5} /> Retry</>
                ) : (
                  <><IconCheck className="h-4 w-4" strokeWidth={2.5} /> Mark as Delivered</>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Signature Pad (canvas-based) ────────────────────────────────────────── */

function SignaturePad({ onChange }: { onChange: (blob: Blob | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    canvas.getContext("2d")!.scale(dpr, dpr);
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPos.current) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth   = 2.2;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    lastPos.current = pos;
    if (isEmpty) setIsEmpty(false);
  }

  function endDraw() {
    if (!drawing) return;
    setDrawing(false);
    canvasRef.current?.toBlob((blob) => onChange(blob), "image/png");
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr  = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.getContext("2d")!.clearRect(0, 0, width * dpr, height * dpr);
    setIsEmpty(true);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div className={cn(
        "relative rounded-xl overflow-hidden border-2 bg-white transition-colors",
        isEmpty
          ? "border-dashed border-slate-200"
          : "border-green-300 shadow-sm",
      )}>
        {/* Baseline rule */}
        {isEmpty && (
          <div className="absolute bottom-8 left-6 right-6 border-b border-slate-200 pointer-events-none" />
        )}
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "128px", display: "block", touchAction: "none" }}
          className="cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none gap-1.5">
            <svg className="h-5 w-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
            <p className="text-[11px] font-medium text-slate-300">Sign here</p>
          </div>
        )}
        {/* Signed badge */}
        {!isEmpty && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <IconCheck className="h-2.5 w-2.5" strokeWidth={3} /> Signed
          </div>
        )}
      </div>

      {!isEmpty && (
        <button type="button" onClick={clear}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors">
          <IconTrash className="h-3 w-3" /> Clear and redo
        </button>
      )}
    </div>
  );
}

/* ── GPS Card ────────────────────────────────────────────────────────────── */

type SosState = "idle" | "confirming" | "sending" | "sent" | "offline_fallback";

function GpsCard({
  status, coords, secsAgo, lastSentAt,
  isNetworkIssue, isStale,
  isOnline, offlineQueue, isFlushing, rejectedCount,
  orgPhone, orgName, trackingCode,
  onStart, onStop, onSos,
}: {
  status:          GpsStatus;
  coords:          { lat: number; lng: number; accuracy: number | null } | null;
  secsAgo:         number;
  lastSentAt:      Date | null;
  isNetworkIssue:  boolean;
  isStale:         boolean;
  isOnline:        boolean;
  offlineQueue:    number;
  isFlushing:      boolean;
  rejectedCount:   number;
  orgPhone:        string | null;
  orgName:         string;
  trackingCode:    string;
  onStart:         () => void;
  onStop:          () => void;
  onSos:           () => Promise<{ smsSent: boolean; orgPhone: string | null }>;
}) {
  const [sosState, setSosState] = useState<SosState>("idle");

  async function handleSos() {
    if (sosState === "confirming") {
      if (!isOnline) {
        setSosState("offline_fallback");
        return;
      }
      setSosState("sending");
      try {
        const result = await onSos();
        setSosState("sent");
        if (result.smsSent) {
          toast.success("SOS alert sent to office ✓", { duration: 8_000 });
        } else {
          toast.warning("SOS recorded — office SMS not configured. Please call directly.");
        }
      } catch {
        setSosState("offline_fallback");
      }
      setTimeout(() => setSosState("idle"), 15_000);
    } else {
      setSosState("confirming");
    }
  }

  /* ── EC-04: Permission denied ── */
  if (status === "denied") {
    return (
      <div className="rounded-xl overflow-hidden border border-red-200 shadow-sm">
        <div className="bg-red-500 px-4 py-3 flex items-center gap-2.5">
          <IconAlertTriangle className="h-4 w-4 text-white shrink-0" strokeWidth={2.5} />
          <p className="text-white text-sm font-bold">Location Access Denied</p>
        </div>
        <div className="bg-red-50 px-4 py-4 space-y-3">
          <p className="text-sm text-red-700 font-medium">Enable GPS to share your location:</p>
          <ol className="space-y-2">
            {[
              "Tap the lock icon in your browser address bar",
              'Set "Location" to Allow',
              "Reload the page and try again",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-red-600">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-200 text-red-700 text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <button onClick={onStart}
            className="flex items-center gap-1.5 text-sm font-bold text-red-700 hover:text-red-900 mt-1 transition-colors">
            <IconRefresh className="h-4 w-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  /* ── Unavailable / timeout ── */
  if (status === "unavailable" || status === "timeout") {
    return (
      <div className="rounded-xl overflow-hidden border border-amber-200 shadow-sm">
        <div className="bg-amber-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconWifiOff className="h-4 w-4 text-white" strokeWidth={2} />
            <p className="text-white text-sm font-bold">GPS Unavailable</p>
          </div>
          <button onClick={onStart}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
            <IconRefresh className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
        <div className="bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700">
            Check that GPS is enabled in your device settings, then retry.
          </p>
        </div>
      </div>
    );
  }

  /* ── Idle ── */
  if (status === "idle") {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
            <IconSatellite className="h-5 w-5 text-slate-500" stroke={1.8} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">GPS Tracking</p>
            <p className="text-xs text-slate-400">Not started · updates every 15s</p>
          </div>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-medium">Off</span>
        </div>
        {offlineQueue > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
            <IconCloudUpload className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              {offlineQueue} GPS {offlineQueue === 1 ? "point" : "points"} saved offline — will sync when connected
            </p>
          </div>
        )}
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Share your real-time location so the customer and dispatcher can track this delivery.
          GPS works offline — points are saved and synced when internet returns.
        </p>
        <button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-cf-primary text-white py-3.5 text-sm font-bold hover:bg-cf-primary/90 active:scale-[0.98] transition-all shadow-sm"
        >
          <IconNavigation className="h-4 w-4" strokeWidth={2.5} />
          Start GPS Tracking
        </button>
      </div>
    );
  }

  /* ── Acquiring ── */
  if (status === "acquiring") {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700">Acquiring GPS signal…</p>
            <p className="text-xs text-slate-400 mt-0.5">This may take up to 30 seconds</p>
          </div>
          <button onClick={onStop}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="h-0.5 bg-slate-200 overflow-hidden">
          <div className="h-full bg-cf-primary"
            style={{ width: "40%", animation: "cf-gps-progress 2s ease-in-out infinite" }} />
        </div>
        <style>{`@keyframes cf-gps-progress{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}`}</style>
      </div>
    );
  }

  /* ── Active ── */

  const isOfflineMode = !isOnline;
  const hasIssue      = isNetworkIssue || isStale || isOfflineMode;
  const headerColor   = isOfflineMode
    ? "bg-slate-600"
    : hasIssue ? "bg-amber-500" : "bg-green-600";
  const bodyBg        = isOfflineMode
    ? "bg-slate-50"
    : hasIssue ? "bg-amber-50" : "bg-green-50";
  const labelColor    = isOfflineMode
    ? "text-slate-500"
    : hasIssue ? "text-amber-600/70" : "text-green-700/70";

  const headerLabel = isOfflineMode
    ? "GPS OFFLINE — Saving Locally"
    : isNetworkIssue ? "GPS — Network Issues"
    : isStale ? "GPS — Signal Lost"
    : "GPS LIVE";

  return (
    <div className={cn("rounded-xl overflow-hidden border shadow-sm",
      isOfflineMode ? "border-slate-300"
      : hasIssue ? "border-amber-200" : "border-green-200")}>

      {/* ── Header ── */}
      <div className={cn("px-4 py-2.5 flex items-center justify-between", headerColor)}>
        <div className="flex items-center gap-2.5">
          {isOfflineMode ? (
            <IconWifiOff className="h-4 w-4 text-white shrink-0" strokeWidth={2} />
          ) : hasIssue ? (
            <IconWifiOff className="h-4 w-4 text-white shrink-0" strokeWidth={2} />
          ) : (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
          )}
          <span className="text-white text-sm font-bold tracking-wide">{headerLabel}</span>

          {/* Offline queue badge */}
          {offlineQueue > 0 && !isFlushing && (
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {offlineQueue} queued
            </span>
          )}
          {isFlushing && (
            <span className="flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <IconCloudUpload className="h-2.5 w-2.5 animate-bounce" />
              Syncing…
            </span>
          )}
        </div>
        <button onClick={onStop}
          className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          title="Stop GPS tracking">
          <IconX className="h-4 w-4" />
        </button>
      </div>

      {/* ── Velocity rejection warning ── */}
      {rejectedCount > 0 && (
        <div className="flex items-start gap-2.5 bg-red-50 border-b border-red-100 px-4 py-2.5">
          <IconAlertOctagon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="text-xs font-bold text-red-700">
              {rejectedCount} location{rejectedCount > 1 ? "s" : ""} rejected by server
            </p>
            <p className="text-[11px] text-red-600 mt-0.5">
              GPS signal is jumping — this may be fixed by moving to an open area.
            </p>
          </div>
        </div>
      )}

      {/* ── Coordinates ── */}
      {coords && (
        <div className={cn("px-4 py-3", bodyBg)}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-0.5", labelColor)}>Latitude</p>
              <p className="font-mono text-base font-bold text-slate-800">{coords.lat.toFixed(6)}°</p>
            </div>
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-0.5", labelColor)}>Longitude</p>
              <p className="font-mono text-base font-bold text-slate-800">{coords.lng.toFixed(6)}°</p>
            </div>
          </div>
          {coords.accuracy != null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Accuracy</p>
                <p className={cn("text-[10px] font-bold",
                  coords.accuracy < 20 ? "text-green-600"
                  : coords.accuracy < 50 ? "text-amber-600" : "text-red-500")}>
                  ±{Math.round(coords.accuracy)} m
                </p>
              </div>
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500",
                  coords.accuracy < 20 ? "bg-green-500"
                  : coords.accuracy < 50 ? "bg-amber-400" : "bg-red-400")}
                  style={{ width: `${Math.max(10, 100 - Math.min(coords.accuracy, 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Status footer ── */}
      <div className="bg-white border-t border-slate-100 px-4 py-2.5">
        {isOfflineMode ? (
          <p className="text-xs font-semibold text-slate-500">
            📡 Offline — GPS points saved locally ({offlineQueue}) · will auto-sync when connected
          </p>
        ) : lastSentAt ? (
          <p className={cn("text-xs font-semibold",
            hasIssue ? "text-amber-600" : "text-green-600")}>
            {isStale
              ? `⚠ Last sent ${secsAgo}s ago — check connection`
              : isNetworkIssue
                ? "⚠ Failed to send — retrying…"
                : secsAgo < 5 ? "✓ Location just sent" : `✓ Sent ${secsAgo}s ago · every 15s`}
          </p>
        ) : (
          <p className="text-xs text-slate-400">Sending first location update…</p>
        )}
      </div>

      {/* ── SOS section ── */}
      <div className="bg-white border-t border-slate-100 px-4 py-3">
        {sosState === "idle" && (
          <button
            onClick={handleSos}
            className="flex items-center justify-center gap-2 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
          >
            <IconAlertOctagon className="h-3.5 w-3.5" strokeWidth={2.5} />
            Emergency — Send SOS to Office
          </button>
        )}

        {sosState === "confirming" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2.5">
            <div className="flex items-start gap-2">
              <IconAlertOctagon className="h-4 w-4 text-red-600 shrink-0 mt-0.5" strokeWidth={2.5} />
              <div>
                <p className="text-xs font-bold text-red-800">Send emergency alert?</p>
                <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">
                  This will SMS {orgName} with your current GPS coordinates.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSosState("idle")}
                className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSos()}
                className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
              >
                Yes, Send SOS
              </button>
            </div>
          </div>
        )}

        {sosState === "sending" && (
          <div className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-red-600">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
            Sending SOS…
          </div>
        )}

        {sosState === "sent" && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
            <IconCheck className="h-3.5 w-3.5 text-green-600 shrink-0" strokeWidth={2.5} />
            <p className="text-xs font-bold text-green-700">SOS sent to office ✓</p>
          </div>
        )}

        {sosState === "offline_fallback" && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-bold text-slate-700">No internet — contact office directly:</p>
            <div className="flex gap-2">
              {orgPhone ? (
                <>
                  <a
                    href={`tel:${orgPhone}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cf-primary py-2.5 text-xs font-bold text-white hover:bg-cf-primary/90 transition-colors"
                  >
                    <IconPhone className="h-3.5 w-3.5" strokeWidth={2} /> Call Office
                  </a>
                  <a
                    href={`sms:${orgPhone}?body=SOS%20${encodeURIComponent(trackingCode)}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    SMS Office
                  </a>
                </>
              ) : (
                <p className="text-xs text-slate-500">Office phone not configured. Contact your supervisor.</p>
              )}
            </div>
            <button onClick={() => setSosState("idle")}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
              Dismiss
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

/* ── Issue Modal ─────────────────────────────────────────────────────────── */

function IssueModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string, notes: string) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const m = t.driverPortal.details.issueModal;
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  return (
    <div className="cf-dashboard fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="bg-red-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <IconAlertTriangle className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">{m.title}</p>
              <p className="text-red-100 text-[11px] mt-0.5">{m.subtitle}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{m.reason}</p>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
            >
              <option value="" disabled>{m.reasonPlaceholder}</option>
              <option value={m.reasons.customerUnreachable}>{m.reasons.customerUnreachable}</option>
              <option value={m.reasons.wrongAddress}>{m.reasons.wrongAddress}</option>
              <option value={m.reasons.vehicleBreakdown}>{m.reasons.vehicleBreakdown}</option>
              <option value={m.reasons.other}>{m.reasons.other}</option>
            </select>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{m.notes}</p>
            <textarea
              rows={3}
              placeholder={m.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors">
            {m.cancel}
          </button>
          <button
            disabled={!reason || isSubmitting}
            onClick={() => { setSubmitting(true); onConfirm(reason, notes); }}
            className="px-5 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? m.submitting : m.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
