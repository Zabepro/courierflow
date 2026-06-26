/**
 * Server-side geocoding (Nominatim) + road routing (OSRM). Both use free,
 * key-less public endpoints biased to Tanzania. Everything is best-effort:
 * on any failure we return null and the caller falls back gracefully.
 */

export type LatLng = { lat: number; lng: number };

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OSRM      = "https://router.project-osrm.org/route/v1/driving";
const UA        = "CourierFlow/1.0 (delivery tracking; +https://courierflow-drab.vercel.app)";

/** Single Nominatim lookup. Returns the first hit or null. */
async function queryNominatim(q: string): Promise<LatLng | null> {
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
 * Turn a free-text address into coordinates. Stored addresses are often the
 * full Nominatim display name (e.g. "Kariakoo, Ilala Municipal, Dar es Salaam,
 * Coastal Zone, 11106, Tanzania") which is *too* specific and returns nothing.
 * So we try progressively shorter variants until one resolves.
 */
export async function geocodeAddress(address: string, city?: string | null): Promise<LatLng | null> {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  const hasCity = !!city && address.toLowerCase().includes(city.toLowerCase());

  const candidates: string[] = [];
  if (city && !hasCity) candidates.push(`${address}, ${city}`);
  candidates.push(address);
  // Progressively trim trailing segments (most specific → least).
  for (const n of [4, 3, 2, 1]) {
    if (parts.length > n) {
      const base = parts.slice(0, n).join(", ");
      candidates.push(city && !base.toLowerCase().includes(city.toLowerCase()) ? `${base}, ${city}` : base);
    }
  }

  const seen = new Set<string>();
  for (const c of candidates) {
    const q = c.trim();
    if (q.length < 3 || seen.has(q)) continue;
    seen.add(q);
    const hit = await queryNominatim(q);
    if (hit) return hit;
  }
  return null;
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
