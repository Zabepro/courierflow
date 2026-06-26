"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Icons ───────────────────────────────────────────────────────────────── */

const truckIcon = L.divIcon({
  className: "custom-truck-icon",
  html: `<div style="background: white; border-radius: 50%; padding: 6px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06); border: 2.5px solid #10b981; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5"></path></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const destIcon = L.divIcon({
  className: "custom-dest-icon",
  html: `<div style="background: white; border-radius: 50%; padding: 6px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 2.5px solid #3b82f6; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/* ── Dynamic Bounds Updater ──────────────────────────────────────────────── */

function MapBoundsUpdater({ driverLat, driverLng, destLat, destLng }: { driverLat: number, driverLng: number, destLat?: number, destLng?: number }) {
  const map = useMap();
  useEffect(() => {
    if (destLat && destLng) {
      map.fitBounds([[driverLat, driverLng], [destLat, destLng]], { padding: [50, 50], animate: true, maxZoom: 16 });
    } else {
      map.setView([driverLat, driverLng]);
    }
  }, [driverLat, driverLng, destLat, destLng, map]);
  return null;
}

/* ── Route Fetcher ───────────────────────────────────────────────────────── */

function RouteDrawer({ driverLat, driverLng, address, city, onDestFound }: { driverLat: number, driverLng: number, address?: string, city?: string | null, onDestFound: (lat: number, lng: number) => void }) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);

  /* 1. Geocode the destination address */
  useEffect(() => {
    if (!address) return;
    let isActive = true;

    async function geocode() {
      try {
        const q = encodeURIComponent(`${address}${city ? `, ${city}` : ''}`);
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
        const geoData = await geoRes.json();
        
        if (!isActive || !geoData || geoData.length === 0) return;
        
        const dLat = parseFloat(geoData[0].lat);
        const dLng = parseFloat(geoData[0].lon);
        setDestCoords([dLat, dLng]);
        onDestFound(dLat, dLng);
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    }

    geocode();
    return () => { isActive = false; };
  }, [address, city, onDestFound]);

  /* 2. Fetch OSRM route dynamically as driver moves */
  useEffect(() => {
    if (!destCoords) return;
    const currentDest = destCoords;
    let isActive = true;

    async function fetchRoute() {
      try {
        const [dLat, dLng] = currentDest;
        const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${driverLng},${driverLat};${dLng},${dLat}?overview=full&geometries=geojson`);
        const osrmData = await osrmRes.json();
        if (!isActive || !osrmData.routes || osrmData.routes.length === 0) return;

        const coords = osrmData.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
        setRouteCoords(coords);
      } catch (err) {
        console.error("Routing error:", err);
      }
    }

    // Debounce or just fetch immediately? OSRM allows reasonable limits. 
    // We only ping GPS every 15s anyway.
    fetchRoute();
    return () => { isActive = false; };
  }, [driverLat, driverLng, destCoords]);

  return (
    <>
      {routeCoords && (
        <Polyline positions={routeCoords} pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.8 }} />
      )}
      {destCoords && (
        <Marker position={destCoords} icon={destIcon} />
      )}
    </>
  );
}

/* ── Main Map Component ──────────────────────────────────────────────────── */

export default function LiveMap({ lat, lng, accuracy, address, city }: { lat: number; lng: number; accuracy: number | null; address?: string; city?: string | null }) {
  const [mounted, setMounted] = useState(false);
  const [destLat, setDestLat] = useState<number | undefined>(undefined);
  const [destLng, setDestLng] = useState<number | undefined>(undefined);

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
      <MapBoundsUpdater driverLat={lat} driverLng={lng} destLat={destLat} destLng={destLng} />
      
      {address && (
        <RouteDrawer 
          driverLat={lat} 
          driverLng={lng} 
          address={address} 
          city={city} 
          onDestFound={(dLat, dLng) => { setDestLat(dLat); setDestLng(dLng); }} 
        />
      )}

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
