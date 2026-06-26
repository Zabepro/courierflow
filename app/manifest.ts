import type { MetadataRoute } from "next";

/**
 * Web App Manifest — makes CourierFlow installable ("Add to Home Screen") and
 * launchable as a standalone app, which is ideal for drivers working from their
 * phones. Next.js serves this at /manifest.webmanifest and links it automatically.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "CourierFlow — Delivery Management",
    short_name:       "CourierFlow",
    description:      "Dispatch drivers, track parcels live and capture proof of delivery.",
    start_url:        "/dashboard",
    scope:            "/",
    display:          "standalone",
    orientation:      "portrait-primary",
    background_color: "#0b5d5e",
    theme_color:      "#0b5d5e",
    lang:             "en",
    categories:       ["business", "productivity", "navigation"],
    icons: [
      { src: "/icon-192.png",          sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png",          sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
