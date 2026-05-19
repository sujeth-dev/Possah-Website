import Image from 'next/image'
import Link from 'next/link'
import type { CollectionBannerData } from '@/app/(shop)/page'

interface CollectionBannerProps {
  data: CollectionBannerData
}

export function CollectionBanner({ data }: CollectionBannerProps) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: 'clamp(300px, 45vw, 580px)' }}
      aria-label={`Collection: ${data.headline}`}
    >
      <Image
        src={data.image}
        alt={data.headline}
        fill
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, rgba(15,25,18,0.70) 0%, rgba(15,25,18,0.25) 60%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Content — left aligned, vertically centred */}
      <div className="absolute inset-0 flex items-center">
        <div className="container-site">
          <div className="max-w-[520px]">
            {/* Sub-label */}
            {data.subtitle && (
              <p
                className="mb-3"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'rgba(244,236,223,0.7)',
                  letterSpacing: '0.02em',
                }}
              >
                {data.subtitle}
              </p>
            )}

            {/* Headline */}
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5.5vw, 72px)',
                fontWeight: '400',
                color: 'var(--color-white)',
                lineHeight: 1.0,
                letterSpacing: '-0.01em',
                marginBottom: '28px',
              }}
            >
              {data.headline}
            </h2>

            {/* CTA */}
            <Link
              href={data.ctaLink}
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
              {data.ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
