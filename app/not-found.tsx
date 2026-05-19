import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-24">
      {/* Giant 404 */}
      <p
        aria-hidden="true"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(80px, 18vw, 200px)',
          fontWeight: '400',
          color: 'var(--color-border)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          userSelect: 'none',
        }}
      >
        404
      </p>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 4vw, 40px)',
          fontWeight: '400',
          color: 'var(--color-text)',
          letterSpacing: '-0.01em',
          marginTop: -16,
          marginBottom: 12,
        }}
      >
        This page wore itself out.
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '15px',
          color: 'var(--color-text-muted)',
          lineHeight: 1.7,
          maxWidth: 400,
          marginBottom: 32,
        }}
      >
        The page you&rsquo;re looking for has moved, been retired, or never existed. Let&rsquo;s find you something worth wearing.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/shop/sarees"
          className="inline-flex items-center justify-center px-10 py-3.5 transition-opacity duration-200 hover:opacity-80"
          style={{
            backgroundColor: 'var(--color-green)',
            color: 'var(--color-white)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            borderRadius: 'var(--radius-btn)',
          }}
        >
          Browse The Edit
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-10 py-3.5 transition-opacity duration-200 hover:opacity-70"
          style={{
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            borderRadius: 'var(--radius-btn)',
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
