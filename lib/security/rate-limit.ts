import { NextResponse } from "next/server";
import { redis } from "@/lib/redis/client";

type RequestWithHeaders = { headers: Headers };

export function getClientIp(req: RequestWithHeaders): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function checkRateLimit(key: string, limit: number, windowSeconds: number) {
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    return { allowed: count <= limit, unavailable: false };
  } catch (error) {
    console.error("[Rate limit] Redis unavailable:", error);
    return { allowed: false, unavailable: true };
  }
}

/**
 * Enforce a rate limit and return a 429 response when the caller is over the
 * limit. Fails open (returns `null`, i.e. allow) when Redis is unavailable so a
 * cache outage never takes down an authenticated endpoint — the breach is
 * logged for monitoring instead.
 *
 * @returns a `NextResponse` to return immediately, or `null` to continue.
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  const { allowed, unavailable } = await checkRateLimit(key, limit, windowSeconds);

  if (unavailable) return null; // fail open — availability over strictness

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      { status: 429, headers: { "Retry-After": String(windowSeconds) } }
    );
  }

  return null;
}
