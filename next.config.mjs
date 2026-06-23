/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

// Only wrap with Sentry's webpack plugin during production builds.
// In dev / Turbopack we skip it — it instruments every module and
// is the main cause of slow startup times.
let config = nextConfig;

if (process.env.NODE_ENV === "production") {
  const { withSentryConfig } = await import("@sentry/nextjs");
  config = withSentryConfig(nextConfig, {
    org:                   "issa-ahmadi-mchowera",
    project:               "javascript-nextjs",
    silent:                true,
    authToken:             process.env.SENTRY_AUTH_TOKEN,
    hideSourceMaps:        true,
    widenClientFileUpload: false,
    tunnelRoute:           "/monitoring",
  });
}

export default config;
