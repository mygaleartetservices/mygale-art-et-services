/**
 * Lightweight in-memory rate limiter.
 *
 * The stack has no Redis/Upstash dependency today, so this uses a
 * process-local fixed-window counter. That's a real limitation on
 * multi-instance/serverless deployments (each instance has its own counter),
 * but it still meaningfully blocks the naive scripted abuse this is meant to
 * stop (contact-form spam, login brute-forcing) and costs no new
 * infrastructure. If the app moves to a multi-instance deployment where this
 * matters, swap the store below for `@upstash/ratelimit` (or similar)
 * without changing call sites.
 */

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Periodically drop stale buckets so this map doesn't grow unbounded.
const CLEANUP_INTERVAL_MS = 5 * 60_000
let lastCleanup = Date.now()

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
}

/**
 * Checks and increments the request count for `key` within `windowMs`.
 * Returns `success: false` once `limit` has been hit for the current window.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanup(now)

  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }

  bucket.count += 1

  const success = bucket.count <= limit
  return {
    success,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(0, Math.ceil((bucket.resetAt - now) / 1000)),
  }
}

/**
 * Read-only check: true if `key` has already hit `limit` for its current
 * window, without consuming an attempt. Used to reject a request before
 * doing any real work (e.g. a bcrypt compare) when the caller intends to
 * record the attempt separately, only on the failure path — see
 * `recordFailedAttempt` below.
 */
export function isRateLimited(key: string, limit: number): boolean {
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= Date.now()) return false
  return bucket.count >= limit
}

/** Consumes one attempt from `key`'s bucket — see `isRateLimited` above. */
export function recordFailedAttempt(key: string, limit: number, windowMs: number): void {
  rateLimit(key, limit, windowMs)
}

/**
 * Best-effort client identifier from request headers. Trusts
 * `x-forwarded-for` (set by the platform's proxy/CDN) and falls back to a
 * shared bucket key when no client IP is available.
 */
export function getClientIp(headers: Pick<Headers, 'get'>): string {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
