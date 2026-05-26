export const BASE_URL = 'http://localhost:3000'
const BASE = BASE_URL
const TIMEOUT_MS = 12000

/**
 * HTTP wrapper — returns { status, data } always.
 * Never throws — network errors returned as status 0.
 */
export async function api(method, path, body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    clearTimeout(timer)
    let data
    try { data = await res.json() } catch { data = {} }
    return { status: res.status, data }
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      console.error(`[http] Timeout: ${method} ${path} (>${TIMEOUT_MS}ms)`)
    } else {
      console.error(`[http] Network error: ${err.message}`)
    }
    return { status: 0, data: {} }
  }
}

/**
 * POST to webhook endpoint with a raw body string and Razorpay signature header.
 */
export async function webhook(rawBody, signature) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}/api/payments/webhook`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
      },
      body: rawBody,
    })
    clearTimeout(timer)
    let data
    try { data = await res.json() } catch { data = {} }
    return { status: res.status, data }
  } catch (err) {
    clearTimeout(timer)
    return { status: 0, data: {} }
  }
}
