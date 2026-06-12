import type { Metadata } from 'next'
import Link from 'next/link'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'

export const metadata: Metadata = {
  title: 'About',
  description: 'Haute couture fashion house in Bengaluru, Karnataka. ThePossah is a celebration of craft, culture, and considered dressing.',
  alternates: { canonical: 'https://thepossah.com/about' },
}

const PILLARS = [
  {
    label: 'The Craft',
    body: 'Every piece begins with a conversation between artisan and fabric. Our artisans in Bengaluru have refined their craft across generations — we simply give their work the stage it deserves.',
  },
  {
    label: 'The Edit',
    body: 'We don\'t do seasons. We do considered curation. Each piece enters the collection because it belongs — not because a trend demanded it.',
  },
  {
    label: 'The Promise',
    body: 'Slow fashion, ethically made. We work directly with artisan clusters, ensuring fair wages and dignified working conditions at every step.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div
        className="relative w-full overflow-hidden flex items-end"
        style={{ minHeight: 'clamp(320px, 45vw, 560px)' }}
      >
        <ImageWithFallback
          src="/images/about-hero.jpg"
          alt="The Possah — Artisan weaving"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.7) 0%, rgba(15,25,18,0.1) 60%, transparent 100%)' }}
          aria-hidden="true"
        />
        <div className="relative container-site pb-12 z-10">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 7vw, 88px)',
              fontWeight: '400',
              color: 'var(--color-white)',
              lineHeight: 1,
              letterSpacing: '0.04em',
            }}
          >
            THE POSSAH
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(244,236,223,0.7)',
              marginTop: 8,
            }}
          >
            Bengaluru · Est. 2024
          </p>
        </div>
      </div>

      {/* Brand statement */}
      <section className="section-gap">
        <div className="container-site max-w-[800px]">
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 3.5vw, 40px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
            }}
          >
            The Possah is not a fashion brand. It is a love letter to Indian craft — written in fabric, worn on skin, remembered long after the evening ends.
          </p>
        </div>
      </section>

      {/* Three pillars */}
      <section className="section-gap border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container-site">
          <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
            {PILLARS.map(({ label, body }) => (
              <div key={label} className="flex flex-col gap-4">
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--color-green)',
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    lineHeight: 1.8,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder image + quote */}
      <section className="section-gap border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container-site">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div
              className="relative aspect-[3/4] overflow-hidden"
              style={{ borderRadius: 'var(--radius-card)' }}
            >
              <ImageWithFallback
                src="/images/founder.jpg"
                alt="Founder — The Possah"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-col gap-6">
              <blockquote
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(20px, 3vw, 32px)',
                  fontWeight: '400',
                  color: 'var(--color-text)',
                  lineHeight: 1.4,
                  letterSpacing: '-0.01em',
                  fontStyle: 'italic',
                }}
              >
                &ldquo;I wanted to build a brand that treats Indian handloom not as heritage — but as currency. The most relevant thing a woman can wear today.&rdquo;
              </blockquote>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                — Founder, The Possah
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Atelier */}
      <section
        id="atelier"
        className="section-gap border-t"
        style={{ borderColor: 'var(--color-border)', scrollMarginTop: '80px' }}
      >
        <div className="container-site max-w-[680px]">
          <p
            className="mb-3"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-green)',
            }}
          >
            The Atelier
          </p>
          <h2
            className="mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 3.5vw, 36px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            Where every piece begins.
          </h2>
          <p
            className="mb-6"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              lineHeight: 1.8,
              color: 'var(--color-text-muted)',
            }}
          >
            Our studio in Horamavu, Bengaluru is where craft meets curation. Every silhouette is designed, draped, and refined here before it reaches you.
          </p>
          <address
            className="not-italic"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              lineHeight: 1.8,
              color: 'var(--color-text)',
              borderLeft: '2px solid var(--color-gold)',
              paddingLeft: 16,
            }}
          >
            Shop No. 1, Ground Floor, No. 30, 1st Main Road<br />
            Behind Maharaja Furniture Store, Munireddy Layout<br />
            Horamavu, Bengaluru, Karnataka 560113
          </address>
        </div>
      </section>

      {/* CTA */}
      <section
        className="section-gap border-t text-center"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="container-site flex flex-col items-center gap-6">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 48px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
            }}
          >
            Wear it. Feel it. Remember it.
          </h2>
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
            Explore The Edit
          </Link>
        </div>
      </section>
    </>
  )
}
