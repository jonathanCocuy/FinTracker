/**
 * Simple in-memory rate limiter for server actions.
 * Sliding window per userId — resets after `windowMs`.
 * Not persistent across serverless restarts; sufficient for
 * protecting against accidental rapid-fire submits.
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

/** Prune expired entries to avoid unbounded growth. */
function prune() {
  const now = Date.now()
  for (const [key, win] of store) {
    if (win.resetAt <= now) store.delete(key)
  }
}

export interface RateLimitOptions {
  /** Max requests in the window. Default 20. */
  limit?: number
  /** Window size in ms. Default 60_000 (1 min). */
  windowMs?: number
}

/**
 * Returns `{ ok: true }` when the request is allowed,
 * `{ ok: false, retryAfterMs }` when the limit is exceeded.
 */
export function rateLimit(
  userId: string,
  action: string,
  opts: RateLimitOptions = {},
): { ok: true } | { ok: false; retryAfterMs: number } {
  const limit = opts.limit ?? 20
  const windowMs = opts.windowMs ?? 60_000
  const key = `${userId}:${action}`
  const now = Date.now()

  // Prune occasionally (1 in 50 calls)
  if (Math.random() < 0.02) prune()

  const win = store.get(key)
  if (!win || win.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (win.count >= limit) {
    return { ok: false, retryAfterMs: win.resetAt - now }
  }

  win.count++
  return { ok: true }
}
