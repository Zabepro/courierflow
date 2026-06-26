import { prisma } from "@/lib/db/prisma";
import { geocodeAddress, getRoute, type LatLng } from "./geocode";

export type DeliveryGeo = {
  pickup:       LatLng | null;
  dropoff:      LatLng | null;
  plannedRoute: LatLng[] | null;
};

/**
 * Resolve (and cache) a delivery's pickup/dropoff coordinates and the road
 * route between them. Coordinates are geocoded from the addresses on first
 * access; the OSRM road route is computed once and cached on the row. All
 * steps are best-effort — missing data simply comes back as null.
 */
export async function ensureDeliveryGeo(deliveryId: string): Promise<DeliveryGeo> {
  const d = await prisma.delivery.findUnique({
    where:  { id: deliveryId },
    select: {
      pickupAddress: true, deliveryAddress: true, city: true,
      pickupLat: true, pickupLng: true, deliveryLat: true, deliveryLng: true,
      plannedRoute: true,
    },
  });
  if (!d) return { pickup: null, dropoff: null, plannedRoute: null };

  let pickup:  LatLng | null = d.pickupLat   != null && d.pickupLng   != null ? { lat: d.pickupLat,   lng: d.pickupLng   } : null;
  let dropoff: LatLng | null = d.deliveryLat != null && d.deliveryLng != null ? { lat: d.deliveryLat, lng: d.deliveryLng } : null;

  const coordData: {
    pickupLat?: number; pickupLng?: number;
    deliveryLat?: number; deliveryLng?: number;
  } = {};

  if (!pickup) {
    const g = await geocodeAddress(d.pickupAddress, d.city);
    if (g) { pickup = g; coordData.pickupLat = g.lat; coordData.pickupLng = g.lng; }
  }
  if (!dropoff) {
    const g = await geocodeAddress(d.deliveryAddress, d.city);
    if (g) { dropoff = g; coordData.deliveryLat = g.lat; coordData.deliveryLng = g.lng; }
  }

  let plannedRoute = (d.plannedRoute as unknown as LatLng[] | null) ?? null;
  let newRoute: LatLng[] | null = null;
  if (!plannedRoute && pickup && dropoff) {
    newRoute = await getRoute(pickup, dropoff);
    if (newRoute) plannedRoute = newRoute;
  }

  if (Object.keys(coordData).length > 0 || newRoute) {
    await prisma.delivery
      .update({
        where: { id: deliveryId },
        data:  { ...coordData, ...(newRoute ? { plannedRoute: newRoute } : {}) },
      })
      .catch(() => {});
  }

  return { pickup, dropoff, plannedRoute };
}
