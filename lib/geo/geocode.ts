/**
 * Server-side geocoding (Nominatim) + road routing (OSRM). Both use free,
 * key-less public endpoints biased to Tanzania. Everything is best-effort:
 * on any failure we return null and the caller falls back gracefully.
 */

export type LatLng = { lat: number; lng: number };

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OSRM      = "https://router.project-osrm.org/route/v1/driving";
const UA        = "CourierFlow/1.0 (delivery tracking; +https://courierflow-drab.vercel.app)";

/** Turn a free-text address into coordinates. Returns null if not found. */
export async function geocodeAddress(address: string, city?: string | null): Promise<LatLng | null> {
  const q = [address, city].filter(Boolean).join(", ").trim();
  if (q.length < 3) return null;
  try {
    const res = await fetch(
      `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=tz`,
      { headers: { "Accept-Language": "en", "User-Agent": UA }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = data[0];
    if (!hit) return null;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

/**
 * Driving route between two points as an ordered list of [lat,lng] coords
 * following the road network. Returns null on failure.
 */
export async function getRoute(from: LatLng, to: LatLng): Promise<LatLng[] | null> {
  try {
    const url =
      `${OSRM}/${from.lng},${from.lat};${to.lng},${to.lat}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
    };
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!coords?.length) return null;
    // GeoJSON is [lng,lat] — flip to {lat,lng}.
    return coords.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return null;
  }
}
