"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

const truckIcon = L.divIcon({
  className: "custom-truck-icon",
  html: `<div style="background: white; border-radius: 50%; padding: 6px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06); border: 2.5px solid #10b981; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5"></path></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function LiveMap({ lat, lng, accuracy }: { lat: number; lng: number; accuracy: number | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

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
      <MapUpdater lat={lat} lng={lng} />
      <Marker position={[lat, lng]} icon={truckIcon} />
      {accuracy && (
        <Circle
          center={[lat, lng]}
          radius={accuracy}
          pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.15, weight: 1 }}
        />
      )}
    </MapContainer>
  );
}
