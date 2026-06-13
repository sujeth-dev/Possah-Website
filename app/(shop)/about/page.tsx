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
    label: 'The Woman',
    body: 'We design for women who dress for themselves. Women who appreciate beauty, but never depend on it. Women who know that confidence cannot be stitched into a garment, only revealed by one. Possah exists to accompany her, never define her.',
  },
  {
    label: 'The Piece',
    body: 'Every Possah garment is created with intention. Thoughtful silhouettes, refined fabrics, and details that reveal themselves over time. Designed to feel effortless today and relevant years from now. Pieces made to be worn often, remembered always.',
  },
  {
    label: 'The Making',
    body: 'Every piece begins with patience. Crafted in small quantities and available through our made-to-measure service, each garment is produced with attention, precision, and care. Because the finest things are never rushed.',
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
          src="https://cdn.thepossah.com/ui/placeholder.svg"
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
          <p
            className="section-label"
            style={{ color: 'rgba(244,236,223,0.7)', marginBottom: 8 }}
          >
            THE POSSAH
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 64px)',
              fontWeight: '400',
              color: 'var(--color-white)',
              lineHeight: 1.1,
              letterSpacing: '0.02em',
            }}
          >
            She wants what she wants.<br />So we make it.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(14px, 1.5vw, 18px)',
              color: 'rgba(244,236,223,0.8)',
              marginTop: 12,
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            Modern couture and considered ready-to-wear for women who dress with intention.
          </p>
        </div>
      </div>

      {/* Philosophy */}
      <section className="section-gap">
        <div className="container-site max-w-[800px]">
          <p
            className="mb-4"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-green)',
            }}
          >
            THE PHILOSOPHY
          </p>
          <h2
            className="mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 3.5vw, 44px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            For women who choose with certainty.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              lineHeight: 1.8,
              color: 'var(--color-text-muted)',
            }}
          >
            Possah was created for women who know themselves. Not for trends. Not for occasions. Not for approval. For the woman who trusts her instincts, values beauty without excess, and understands that true elegance never asks for attention.
            <br /><br />
            We design for the moments that matter and the ones that don&rsquo;t announce themselves. A wedding. A celebration. A quiet dinner. A spontaneous evening. An ordinary afternoon that somehow becomes unforgettable.
            <br /><br />
            Our pieces are created to move effortlessly between these moments. Rooted in Indian craftsmanship and shaped by a contemporary perspective, every silhouette is considered, refined, and designed to feel distinctly personal. Because luxury isn&rsquo;t about having more. It&rsquo;s about knowing exactly what belongs.
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
                src="https://cdn.thepossah.com/ui/placeholder.svg"
                alt="Founder — The Possah"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-col gap-6">
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--color-green)',
                }}
              >
                A NOTE FROM DEEPTHI
              </p>
              <blockquote
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(18px, 2.5vw, 28px)',
                  fontWeight: '400',
                  color: 'var(--color-text)',
                  lineHeight: 1.45,
                  letterSpacing: '-0.01em',
                  fontStyle: 'italic',
                }}
              >
                &ldquo;I never wanted to create clothes that simply looked beautiful. I wanted to create pieces that made women feel unmistakably themselves. The most memorable women I&rsquo;ve known were never the loudest in the room. They carried a quiet certainty about who they were, what they loved, and what belonged to them. Possah was created for those women. Every silhouette, every fabric, every detail begins with a simple belief: when a woman feels completely herself, nothing is more beautiful.&rdquo;
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
                — Deepthi, Founder, The Possah
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="section-gap border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container-site max-w-[720px]">
          <p
            className="mb-4"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-green)',
            }}
          >
            OUR PROMISE
          </p>
          <h2
            className="mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 3.5vw, 40px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            Made with intention.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              lineHeight: 1.8,
              color: 'var(--color-text-muted)',
            }}
          >
            We believe clothing should feel personal. That is why many Possah pieces are available through our made-to-measure service, allowing every garment to be tailored to the woman who wears it. The result is a piece that feels less like something purchased and more like something created for you. Because the perfect fit is never an afterthought.
          </p>
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
        <div className="container-site flex flex-col items-center gap-4">
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
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--color-text-muted)',
            }}
          >
            Discover pieces designed to become part of your story.
          </p>
          <Link
            href="/shop/sarees"
            className="inline-flex items-center justify-center px-10 py-3.5 transition-opacity duration-200 hover:opacity-80 mt-2"
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
            Explore The Collection
          </Link>
        </div>
      </section>
    </>
  )
}
