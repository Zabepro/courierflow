import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    // Sample 10% of transactions for performance monitoring without flooding quota.
    tracesSampleRate: 0.1,
    debug: false,
  });
}

export const onRequestError = Sentry.captureRequestError;
