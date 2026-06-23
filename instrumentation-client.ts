import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  debug: false,

  // Replay records user sessions — only enable in production (heavy bundle ~150KB)
  ...(process.env.NODE_ENV === "production" && {
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText:   true,
        blockAllMedia: false,
      }),
    ],
  }),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
