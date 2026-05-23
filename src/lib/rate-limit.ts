/**
 * Lightweight in-memory rate limiter. Caps requests per identifier in a sliding
 * window. For multi-instance production, swap the Map for Upstash Redis — the
 * interface stays identical.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param id      Unique key (e.g. user id or IP).
 * @param limit   Max requests per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(
  id: string,
  limit = 12,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(id);

  if (!bucket || now > bucket.resetAt) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(id, fresh);
    return { allowed: true, remaining: limit - 1, resetAt: fresh.resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

// Periodically evict stale buckets so the Map doesn't grow unbounded.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) {
      if (now > b.resetAt) buckets.delete(key);
    }
  }, 120_000).unref?.();
}
