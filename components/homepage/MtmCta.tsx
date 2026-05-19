import Image from 'next/image'
import Link from 'next/link'

export function MtmCta() {
  return (
    <section
      aria-label="Made-to-Measure"
      style={{ backgroundColor: '#E8DDD0' }} // slightly warmer than ivory — matches design kraft/tan tone
    >
      <div className="container-site">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center min-h-[320px] md:min-h-[400px]">

          {/* Left — text */}
          <div className="py-14 md:py-20 pr-0 md:pr-16 order-2 md:order-1">
            {/* Eyebrow */}
            <p
              className="mb-5"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-label)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
              }}
            >
              Made-to-Measure
            </p>

            {/* Headline */}
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(24px, 3.5vw, 44px)',
                fontWeight: '400',
                color: 'var(--color-text)',
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                marginBottom: '16px',
              }}
            >
              This piece doesn&rsquo;t exist yet.
              <br />
              It&rsquo;s waiting for your measurements.
            </h2>

            {/* Body */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.65,
                marginBottom: '28px',
                maxWidth: '380px',
              }}
            >
              Every Possah piece is crafted to your exact measurements.
              Made to move with you, for your bespoke creation.
            </p>

            {/* CTA */}
            <Link
              href="/made-to-measure"
              className="inline-flex items-center gap-2 transition-opacity duration-200 hover:opacity-85"
              style={{
                backgroundColor: 'var(--color-green)',
                color: 'var(--color-bg)',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '13px 28px',
                borderRadius: 'var(--radius-btn)',
              }}
            >
              Book Your Fitting
            </Link>
          </div>

          {/* Right — image */}
          <div className="relative order-1 md:order-2 overflow-hidden" style={{ minHeight: '280px' }}>
            <Image
              src="/images/placeholder-mtm.jpg"
              alt="Artisan hands working on fabric — Made-to-Measure"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
