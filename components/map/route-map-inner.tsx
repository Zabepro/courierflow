"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";

export type LatLng = { lat: number; lng: number };

const DAR: [number, number] = [-6.7924, 39.2083];
const BRAND   = "#0d9488"; // trail (actual path driven)
const ROUTE   = "#1a73e8"; // planned road route (Google-style blue)
const CASING  = "#ffffff"; // white outline under the route
const PICKUP  = "#0d9488";
const DROPOFF = "#ef4444";

/* ── Marker icons ────────────────────────────────────────────────────────── */
function endpointIcon(color: string, letter: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      background:${color};border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center">
      <span style="transform:rotate(45deg);color:white;font:800 12px system-ui,sans-serif">${letter}</span>
    </div>`,
    iconSize:    [26, 26],
    iconAnchor:  [13, 26],
  });
}

function driverIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:36px;height:36px">
      <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(13,148,136,0.5);animation:cf-marker-pulse 1.8s ease-out infinite"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:${BRAND};border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5"/></svg>
      </div>
    </div>`,
    iconSize:    [36, 36],
    iconAnchor:  [18, 18],
  });
}

export default function RouteMapInner({
  pickup, dropoff, plannedRoute, trail, driver, fitNonce,
}: {
  pickup?:       LatLng | null;
  dropoff?:      LatLng | null;
  plannedRoute?: LatLng[] | null;
  trail?:        LatLng[];
  driver?:       LatLng | null;
  fitNonce?:     number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const staticRef    = useRef<L.LayerGroup | null>(null);
  const dynamicRef   = useRef<L.LayerGroup | null>(null);
  const fittedRef    = useRef(false);

  /* Init once */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: DAR, zoom: 12, zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OSM &copy; CARTO', maxZoom: 19, subdomains: "abcd",
    }).addTo(map);
    staticRef.current  = L.layerGroup().addTo(map);
    dynamicRef.current = L.layerGroup().addTo(map);
    mapRef.current     = map;

    /* Inside animated panels/sheets the container starts at 0×0, leaving Leaflet
       with grey tiles. Recompute the size once the layout settles and whenever
       the container resizes. */
    const fix = () => map.invalidateSize();
    const t1 = setTimeout(fix, 250);
    const t2 = setTimeout(fix, 600);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fix) : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);

    return () => {
      clearTimeout(t1); clearTimeout(t2); ro?.disconnect();
      map.remove(); mapRef.current = null; staticRef.current = null; dynamicRef.current = null; fittedRef.current = false;
    };
  }, []);

  /* Static layer: planned route + pickup/dropoff markers */
  useEffect(() => {
    const map = mapRef.current, layer = staticRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (plannedRoute && plannedRoute.length > 1) {
      const line = plannedRoute.map((p) => [p.lat, p.lng] as [number, number]);
      // White casing under a bold blue route — the "Google Maps" look.
      L.polyline(line, { color: CASING, weight: 9, opacity: 0.9, lineCap: "round", lineJoin: "round" }).addTo(layer);
      L.polyline(line, { color: ROUTE,  weight: 5, opacity: 1,   lineCap: "round", lineJoin: "round" }).addTo(layer);
    } else if (pickup && dropoff) {
      // No road route available — show a straight hint line instead.
      L.polyline([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]], {
        color: ROUTE, weight: 3, opacity: 0.6, dashArray: "2 9", lineCap: "round",
      }).addTo(layer);
    }

    if (pickup)  L.marker([pickup.lat,  pickup.lng],  { icon: endpointIcon(PICKUP,  "A") }).bindPopup("Pickup").addTo(layer);
    if (dropoff) L.marker([dropoff.lat, dropoff.lng], { icon: endpointIcon(DROPOFF, "B") }).bindPopup("Drop-off").addTo(layer);
  }, [pickup, dropoff, plannedRoute]);

  /* Dynamic layer: travelled trail + live driver marker */
  useEffect(() => {
    const map = mapRef.current, layer = dynamicRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (trail && trail.length > 1) {
      const line = trail.map((p) => [p.lat, p.lng] as [number, number]);
      L.polyline(line, { color: CASING, weight: 7, opacity: 0.85, lineCap: "round", lineJoin: "round" }).addTo(layer);
      L.polyline(line, { color: BRAND,  weight: 4, opacity: 1,    lineCap: "round", lineJoin: "round" }).addTo(layer);
    }
    if (driver) {
      L.marker([driver.lat, driver.lng], { icon: driverIcon(), zIndexOffset: 1000 }).addTo(layer);
    }
  }, [trail, driver]);

  /* Fit bounds to everything we have — once on first data, then on fitNonce. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pts: [number, number][] = [];
    if (pickup)  pts.push([pickup.lat,  pickup.lng]);
    if (dropoff) pts.push([dropoff.lat, dropoff.lng]);
    if (driver)  pts.push([driver.lat,  driver.lng]);
    (trail ?? []).forEach((p) => pts.push([p.lat, p.lng]));
    (plannedRoute ?? []).forEach((p) => pts.push([p.lat, p.lng]));
    if (pts.length === 0) return;

    const shouldFit = !fittedRef.current || fitNonce != null;
    if (!shouldFit) return;
    fittedRef.current = true;
    if (pts.length === 1) map.setView(pts[0], 15, { animate: true });
    else map.fitBounds(pts, { padding: [50, 50], maxZoom: 16, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup, dropoff, plannedRoute, fitNonce]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%", background: "#e8edf2" }} />;
}
