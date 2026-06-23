import * as Sentry from "@sentry/nextjs";

/**
 * Capture an unexpected error from an API route to Sentry.
 * Always logs to console too — never swallows the error silently.
 */
export function captureApiError(
  err:     unknown,
  context: Record<string, unknown> = {},
): void {
  console.error("[API Error]", context, err);
  Sentry.captureException(err, { extra: context });
}
