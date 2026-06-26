"use client";

import dynamic from "next/dynamic";
import type { LatLng } from "./route-map-inner";

export type { LatLng };

/* Leaflet is client-only — never render it on the server. */
const RouteMapInner = dynamic(() => import("./route-map-inner"), {
  ssr:     false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-cf-primary border-t-transparent" />
    </div>
  ),
});

export function RouteMap(props: {
  pickup?:       LatLng | null;
  dropoff?:      LatLng | null;
  plannedRoute?: LatLng[] | null;
  trail?:        LatLng[];
  driver?:       LatLng | null;
  fitNonce?:     number;
  className?:    string;
  height?:       string;
}) {
  const { className, height = "260px", ...rest } = props;
  return (
    <div className={className} style={{ height }}>
      <RouteMapInner {...rest} />
    </div>
  );
}
