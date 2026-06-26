"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { DriverPin } from "./fleet-map";

/* ── Constants ──────────────────────────────────────────────────── */
const DAR: [number, number] = [-6.7924, 39.2083];

const STATUS_CFG: Record<string, { label: string; dot: string }> = {
  ASSIGNED:   { label: "Assigned",   dot: "#3b82f6" },
  PICKED_UP:  { label: "Picked Up",  dot: "#f59e0b" },
  IN_TRANSIT: { label: "In Transit", dot: "#f97316" },
};

type GpsState = "live" | "stale" | "offline";

const STATE_COLOR: Record<GpsState, string> = {
  live:    "#0d9488",
  stale:   "#f59e0b",
  offline: "#ef4444",
};

/* ── Helpers ─────────────────────────────────────────────────────── */
function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => (w[0] ?? "").toUpperCase()).join("") || "?";
}

function gpsState(ts: string): GpsState {
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60)  return "live";
  if (s < 300) return "stale";
  return "offline";
}

function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

/* ── Icon (Leaflet divIcon) ──────────────────────────────────────── */
function makeIcon(name: string, state: GpsState): L.DivIcon {
  const color  = STATE_COLOR[state];
  const inits  = initials(name);
  const isLive = state === "live";

  const pulse = isLive
    ? `<div style="position:absolute;inset:-10px;border-radius:50%;border:2px solid rgba(13,148,136,0.55);animation:cf-marker-pulse 1.8s ease-out infinite;pointer-events:none"></div>
       <div style="position:absolute;inset:-5px;border-radius:50%;border:2px solid rgba(13,148,136,0.3);animation:cf-marker-pulse 1.8s ease-out 0.7s infinite;pointer-events:none"></div>`
    : "";

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:44px;height:44px">
      ${pulse}
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:${color};border:3px solid white;
        box-shadow:0 4px 16px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
        font-size:14px;font-weight:800;color:white;font-family:system-ui,sans-serif;
        letter-spacing:-0.5px;z-index:1;
      ">${inits}</div>
    </div>`,
    iconSize:    [44, 44],
    iconAnchor:  [22, 22],
    popupAnchor: [0, -28],
  });
}

/* ── Popup HTML ──────────────────────────────────────────────────── */
function endpointIcon(color: string, letter: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid white;box-shadow:0 2px 7px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
      <span style="transform:rotate(45deg);color:white;font:800 11px system-ui,sans-serif">${letter}</span></div>`,
    iconSize:   [22, 22],
    iconAnchor: [11, 22],
  });
}

function popupHtml(pin: DriverPin): string {
  const loc   = pin.location!;
  const state = gpsState(loc.ts);
  const cfg   = STATUS_CFG[pin.status] ?? { label: pin.status, dot: "#94a3b8" };
  const color = STATE_COLOR[state];
  const { lat, lng, accuracy, ts } = loc;
  const stateLabel = state === "live" ? "LIVE" : state === "stale" ? "STALE" : "OFFLINE";
  const accColor   = accuracy == null ? "#334155" : accuracy < 20 ? "#0d9488" : accuracy < 50 ? "#f59e0b" : "#ef4444";

  const phoneRow = pin.driverPhone
    ? `<div style="color:rgba(255,255,255,0.75);font-size:12px;margin-top:2px">${esc(pin.driverPhone)}</div>`
    : "";

  const cityRow = pin.city
    ? `<div style="margin-bottom:4px">
         <div style="font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:2px">City</div>
         <div style="font-size:13px;font-weight:600;color:#1e293b">${esc(pin.city)}</div>
       </div>`
    : "";

  const accRow = accuracy != null
    ? `<div style="display:flex;justify-content:space-between">
         <span style="color:#64748b">Accuracy</span>
         <span style="font-weight:600;color:${accColor}">±${Math.round(accuracy)} m</span>
       </div>`
    : "";

  return `<div style="font-family:system-ui,sans-serif">
    <div style="background:${color};padding:14px 16px 12px;display:flex;align-items:center;gap:12px">
      <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.5);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:white;flex-shrink:0">${initials(pin.driverName)}</div>
      <div style="flex:1;min-width:0">
        <div style="color:white;font-weight:700;font-size:15px">${esc(pin.driverName)}</div>
        ${phoneRow}
      </div>
      <div style="background:rgba(255,255,255,0.2);border-radius:20px;padding:3px 9px;font-size:11px;font-weight:700;color:white;white-space:nowrap;letter-spacing:0.5px">${stateLabel}</div>
    </div>
    <div style="padding:14px 16px;background:white">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <div style="width:8px;height:8px;border-radius:50%;background:${cfg.dot};flex-shrink:0"></div>
        <span style="font-weight:700;font-size:13px;color:#0f172a">${esc(pin.trackingCode)}</span>
        <span style="font-size:11px;font-weight:600;background:${cfg.dot}1a;color:${cfg.dot};border-radius:20px;padding:1px 7px">${esc(cfg.label)}</span>
      </div>
      <div style="margin-bottom:4px">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:2px">Recipient</div>
        <div style="font-size:13px;font-weight:600;color:#1e293b">${esc(pin.recipientName)}</div>
      </div>
      ${cityRow}
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;font-size:12px;display:grid;gap:4px">
        <div style="display:flex;justify-content:space-between">
          <span style="color:#64748b">Last update</span>
          <span style="font-weight:600;color:#334155">${timeAgo(ts)}</span>
        </div>
        ${accRow}
        <div style="display:flex;justify-content:space-between">
          <span style="color:#64748b">Coordinates</span>
          <span style="font-weight:500;font-family:monospace;font-size:11px;color:#334155">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <a href="${pin.dropoff ? `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${lat},${lng}&destination=${pin.dropoff.lat},${pin.dropoff.lng}` : `https://www.google.com/maps?q=${lat},${lng}`}" target="_blank" rel="noopener noreferrer" style="flex:1;padding:8px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#475569;text-align:center;text-decoration:none;display:block">${pin.dropoff ? "Directions" : "Open Maps"}</a>
        <a href="/dashboard/driver/deliveries/${esc(pin.deliveryId)}" target="_blank" rel="noopener noreferrer" style="flex:1;padding:8px;border-radius:8px;background:#0d9488;border:none;font-size:12px;font-weight:600;color:white;text-align:center;text-decoration:none;display:block">Driver View</a>
      </div>
    </div>
  </div>`;
}

/* ── Main component — fully imperative Leaflet ───────────────────────
   We manage the Leaflet map ourselves instead of using react-leaflet's
   <MapContainer>. react-leaflet caches its container div and, under
   Turbopack HMR / React StrictMode double-mount, re-runs init on a div
   that still carries Leaflet's `_leaflet_id` → "Map container is already
   initialized". By calling L.map() / map.remove() directly, Leaflet
   clears `_leaflet_id` on teardown, so re-init is always clean. */
export default function FleetMapInner({
  pins,
  focusId,
  focusNonce,
  fitAllNonce,
}: {
  pins: DriverPin[];
  focusId?: string | null;
  focusNonce?: number;
  fitAllNonce?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const layerRef     = useRef<L.LayerGroup | null>(null);
  const markersRef   = useRef<Record<string, L.Marker>>({});
  const prevCountRef = useRef(-1);

  /* Init once — create map + tile layer. Cleanup removes it entirely. */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DAR,
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current   = map;

    return () => {
      map.remove();
      mapRef.current   = null;
      layerRef.current = null;
      prevCountRef.current = -1;
    };
  }, []);

  /* Re-draw markers whenever pins change. */
  useEffect(() => {
    const map   = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersRef.current = {};

    const active = pins.filter((p) => p.location);
    const pts: [number, number][] = [];

    /* Routes layer — planned road route, travelled trail, pickup/drop-off */
    for (const pin of pins) {
      if (pin.plannedRoute && pin.plannedRoute.length > 1) {
        const line = pin.plannedRoute.map((p) => [p.lat, p.lng] as [number, number]);
        L.polyline(line, { color: "#ffffff", weight: 6,   opacity: 0.85, lineCap: "round", lineJoin: "round" }).addTo(layer);
        L.polyline(line, { color: "#1a73e8", weight: 3.5, opacity: 0.95, lineCap: "round", lineJoin: "round" }).addTo(layer);
      } else if (pin.pickup && pin.dropoff) {
        L.polyline([[pin.pickup.lat, pin.pickup.lng], [pin.dropoff.lat, pin.dropoff.lng]], {
          color: "#1a73e8", weight: 2.5, opacity: 0.5, dashArray: "2 9", lineCap: "round",
        }).addTo(layer);
      }
      if (pin.trail && pin.trail.length > 1) {
        const tline = pin.trail.map((p) => [p.lat, p.lng] as [number, number]);
        L.polyline(tline, { color: "#ffffff", weight: 5.5, opacity: 0.8, lineCap: "round", lineJoin: "round" }).addTo(layer);
        L.polyline(tline, { color: "#0d9488", weight: 3.5, opacity: 0.95, lineCap: "round", lineJoin: "round" }).addTo(layer);
      }
      if (pin.pickup) {
        L.marker([pin.pickup.lat, pin.pickup.lng], { icon: endpointIcon("#0d9488", "A") }).bindPopup("Pickup").addTo(layer);
        pts.push([pin.pickup.lat, pin.pickup.lng]);
      }
      if (pin.dropoff) {
        L.marker([pin.dropoff.lat, pin.dropoff.lng], { icon: endpointIcon("#ef4444", "B") }).bindPopup("Drop-off").addTo(layer);
        pts.push([pin.dropoff.lat, pin.dropoff.lng]);
      }
    }

    for (const pin of active) {
      const { lat, lng, accuracy, ts } = pin.location!;
      const state = gpsState(ts);
      pts.push([lat, lng]);

      if (accuracy) {
        L.circle([lat, lng], {
          radius: accuracy,
          color: STATE_COLOR[state],
          fillColor: STATE_COLOR[state],
          fillOpacity: 0.07,
          weight: 1.5,
          opacity: 0.4,
        }).addTo(layer);
      }

      const marker = L.marker([lat, lng], { icon: makeIcon(pin.driverName, state) })
        .bindPopup(popupHtml(pin), { minWidth: 240, className: "cf-popup" })
        .addTo(layer);
      markersRef.current[pin.deliveryId] = marker;
    }

    /* Auto-fit only when the number of located drivers changes, so we
       don't yank the view on every 5s poll. */
    if (pts.length !== prevCountRef.current) {
      prevCountRef.current = pts.length;
      if (pts.length === 1) {
        map.setView(pts[0], 14, { animate: true });
      } else if (pts.length > 1) {
        map.fitBounds(pts, { padding: [80, 80], maxZoom: 14, animate: true });
      }
    }
  }, [pins]);

  /* Fly to a specific driver + open its popup (triggered from the sidebar). */
  useEffect(() => {
    if (focusNonce == null || !focusId) return;
    const map    = mapRef.current;
    const marker = markersRef.current[focusId];
    if (!map || !marker) return;
    map.flyTo(marker.getLatLng(), 15, { duration: 0.8 });
    marker.openPopup();
  }, [focusNonce, focusId]);

  /* Fit all located drivers into view (triggered from the "Fit all" button). */
  useEffect(() => {
    if (fitAllNonce == null) return;
    const map = mapRef.current;
    if (!map) return;
    const pts = pins.filter((p) => p.location).map((p) => [p.location!.lat, p.location!.lng] as [number, number]);
    if (pts.length === 1) {
      map.setView(pts[0], 14, { animate: true });
    } else if (pts.length > 1) {
      map.fitBounds(pts, { padding: [80, 80], maxZoom: 14, animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitAllNonce]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%", background: "#e8edf2" }} />;
}
