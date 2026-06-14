/**
 * In-memory sliding-window rate limiter.
 *
 * Works per serverless instance — a cold start or a new Vercel instance resets
 * the counter. For true distributed rate limiting across all instances, replace
 * the backing store with Upstash Redis (@upstash/ratelimit).
 *
 * Even per-instance limiting meaningfully reduces abuse: a single client
 * hammering the same endpoint will hit the same warm instance repeatedly.
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

// Periodically evict expired entries to prevent unbounded memory growth.
// Runs only in the Node.js runtime (not edge); safe to call repeatedly.
let cleanupScheduled = false
function scheduleCleanup() {
  if (cleanupScheduled) return
  cleanupScheduled = true
  setTimeout(() => {
    const now = Date.now()
    for (const [key, win] of store) {
      if (win.resetAt < now) store.delete(key)
    }
    cleanupScheduled = false
  }, 60_000)
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * @param key      Unique bucket key (e.g. `contact:${ip}`)
 * @param limit    Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const win = store.get(key)

  if (!win || win.resetAt < now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    scheduleCleanup()
    return { success: true, remaining: limit - 1, resetAt }
  }

  win.count++
  if (win.count > limit) {
    return { success: false, remaining: 0, resetAt: win.resetAt }
  }

  return { success: true, remaining: limit - win.count, resetAt: win.resetAt }
}

/** Extract the best available IP from Vercel / standard headers. */
export function getIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}
