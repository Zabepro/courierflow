"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = { lat: number; lng: number };

/* ── Icons ───────────────────────────────────────────────────────────────── */

const truckIcon = L.divIcon({
  className: "custom-truck-icon",
  html: `<div style="background: white; border-radius: 50%; padding: 6px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.2); border: 2.5px solid #10b981; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5"></path></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function endpointIcon(color: string, letter: string): L.DivIcon {
  return L.divIcon({
    className: "custom-endpoint-icon",
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2.5px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
      <span style="transform:rotate(45deg);color:white;font:800 12px system-ui,sans-serif">${letter}</span></div>`,
    iconSize:   [26, 26],
    iconAnchor: [13, 26],
  });
}

/* ── Fit bounds to everything we have ────────────────────────────────────── */

function BoundsUpdater({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15, { animate: true });
    } else {
      map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [45, 45], maxZoom: 16, animate: true });
    }
    // Re-fit only when the set of endpoints changes (not on every GPS tick).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length, map]);
  return null;
}

/* ── Main Map Component ──────────────────────────────────────────────────── */

export default function LiveMap({
  lat, lng, accuracy, pickup, dropoff, plannedRoute, trail,
}: {
  lat: number;
  lng: number;
  accuracy: number | null;
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  plannedRoute?: LatLng[] | null;
  trail?: LatLng[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Stable bounds: the journey endpoints (driver only moves within them).
  const bounds: LatLng[] = [{ lat, lng }];
  if (pickup)  bounds.push(pickup);
  if (dropoff) bounds.push(dropoff);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 1 }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <BoundsUpdater points={bounds} />

      {/* Planned road route (pickup → drop-off) — white casing + bold blue */}
      {plannedRoute && plannedRoute.length > 1 && (
        <>
          <Polyline
            positions={plannedRoute.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.9, lineCap: "round", lineJoin: "round" }}
          />
          <Polyline
            positions={plannedRoute.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#1a73e8", weight: 5, opacity: 1, lineCap: "round", lineJoin: "round" }}
          />
        </>
      )}

      {/* Trail actually driven so far — white casing + green */}
      {trail && trail.length > 1 && (
        <>
          <Polyline
            positions={trail.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#ffffff", weight: 7, opacity: 0.85, lineCap: "round", lineJoin: "round" }}
          />
          <Polyline
            positions={trail.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#10b981", weight: 4, opacity: 1, lineCap: "round", lineJoin: "round" }}
          />
        </>
      )}

      {pickup  && <Marker position={[pickup.lat,  pickup.lng]}  icon={endpointIcon("#10b981", "A")} />}
      {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={endpointIcon("#ef4444", "B")} />}

      <Marker position={[lat, lng]} icon={truckIcon} />
      {accuracy && (
        <Circle
          center={[lat, lng]}
          radius={accuracy}
          pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.12, weight: 1 }}
        />
      )}
    </MapContainer>
  );
}
