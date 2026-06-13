/**
 * HTML-escape helper for safe interpolation of user-supplied values into
 * HTML email templates and any other server-rendered HTML string.
 *
 * SECURITY (audit S-1): order/contact emails interpolate user input
 * (customer name, product name, address, contact message) directly into HTML.
 * Without escaping, an attacker can inject markup or phishing links into the
 * emails delivered to customers and to the admin inbox. Wrap every
 * user-controlled value in escapeHtml() at the interpolation site.
 *
 * Escapes the five XML-significant characters. Coerces non-strings to string
 * first (null/undefined become '').
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
