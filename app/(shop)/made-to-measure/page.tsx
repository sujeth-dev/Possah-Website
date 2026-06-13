import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { whatsappUrl } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Made-to-Measure',
  description: 'Bespoke Indian fashion handcrafted to your exact measurements at The Possah. Sarees, lehengas, co-ords and more.',
  alternates: { canonical: 'https://thepossah.com/made-to-measure' },
}

const STEPS = [
  {
    num: '01',
    title: 'Choose Your Piece',
    body: 'Begin with any Possah piece marked Made-to-Measure, or connect with our team to discuss a bespoke creation tailored to your requirements.',
  },
  {
    num: '02',
    title: 'Share Your Measurements',
    body: 'We’ll guide you through a simple measurement process, or arrange an in-person fitting where available. Every detail is carefully recorded to ensure precision.',
  },
  {
    num: '03',
    title: 'Fabric & Finishing',
    body: 'Select from curated fabrics, colours, and finishing details. Together, we refine the piece until it feels unmistakably yours.',
  },
  {
    num: '04',
    title: 'Crafted & Delivered',
    body: 'Your garment is handcrafted with care and completed over 15–21 days before arriving in our signature packaging, ready to be worn and remembered.',
  },
]

export default function MadeToMeasurePage() {
  const waLink = whatsappUrl('+919876543210', 'Hi! I\'m interested in a Made-to-Measure piece from The Possah. Can you tell me more?')

  return (
    <>
      {/* Hero */}
      <div
        className="relative w-full overflow-hidden flex items-end"
        style={{ minHeight: 'clamp(280px, 40vw, 500px)' }}
      >
        <Image
          src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
          alt="Made-to-Measure atelier — The Possah"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.65) 0%, transparent 60%)' }}
          aria-hidden="true"
        />
        <div className="relative container-site pb-12 z-10">
          <p className="section-label" style={{ color: 'rgba(244,236,223,0.7)', marginBottom: 8 }}>
            THE POSSAH ATELIER
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: '400',
              color: 'var(--color-white)',
              lineHeight: 1,
              letterSpacing: '0.04em',
            }}
          >
            MADE-TO-MEASURE
          </h1>
        </div>
      </div>

      {/* Intro */}
      <section className="section-gap">
        <div className="container-site max-w-[720px]">
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 3vw, 36px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
            }}
          >
            Some pieces are purchased. Others are created. Our Made-to-Measure service allows each garment to be tailored specifically for you — from fit and proportions to finishing details. The result is a piece that feels less like something bought and more like something that belongs to you. Because the perfect fit should never be an afterthought.
          </p>
        </div>
      </section>

      {/* Process steps */}
      <section className="section-gap border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container-site">
          <h2
            className="mb-10"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            THE PROCESS
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ num, title, body }) => (
              <div key={num} className="flex flex-col gap-4">
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '28px',
                    color: 'var(--color-border)',
                    lineHeight: 1,
                  }}
                >
                  {num}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: 'var(--color-text)',
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    lineHeight: 1.75,
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

      {/* Why Made-to-Measure */}
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
            WHY MADE-TO-MEASURE
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              lineHeight: 1.8,
              color: 'var(--color-text-muted)',
            }}
          >
            Every woman is different. Her proportions. Her preferences. The way she likes a sleeve to fall or a hem to sit. Made-to-Measure allows us to honour those details. Each garment is adjusted specifically for the woman who will wear it, creating a level of comfort, confidence, and ease that standard sizing simply cannot replicate. Because true luxury is personal.
          </p>
        </div>
      </section>

      {/* Gallery + CTA */}
      <section className="section-gap border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container-site">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div className="grid grid-cols-2 gap-3">
              {[
                'https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg',
                'https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg',
                'https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg',
                'https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg',
              ].map(
                (src, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden"
                    style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-card)' }}
                  >
                    <Image
                      src={src}
                      alt={`Made-to-Measure piece ${i + 1}`}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                )
              )}
            </div>
            <div className="flex flex-col gap-6">
              <p className="section-label">START YOUR ORDER</p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(24px, 4vw, 48px)',
                  fontWeight: '400',
                  color: 'var(--color-text)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                This piece doesn&rsquo;t exist yet. It is waiting for you.
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: 'var(--color-text-muted)',
                }}
              >
                Begin your bespoke journey with Possah. Our team will guide you through measurements, customisation options, and timelines to create a piece designed specifically for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 transition-opacity duration-200 hover:opacity-80"
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
                  Begin Your Fitting
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 transition-opacity duration-200 hover:opacity-70"
                  style={{
                    border: '1.5px solid var(--color-green)',
                    color: 'var(--color-green)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  Speak With Our Atelier
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
