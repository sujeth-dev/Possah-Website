import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for purchasing from The Possah.',
  alternates: { canonical: 'https://thepossah.com/terms' },
}

export default function TermsPage() {
  return (
    <div className="container-site py-16 pb-24 max-w-[800px] mx-auto">
      <p className="section-label mb-4">LEGAL</p>
      <h1
        className="mb-12"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 5vw, 64px)',
          fontWeight: '400',
          color: 'var(--color-text)',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}
      >
        Terms &amp; Conditions
      </h1>

      <div className="flex flex-col gap-8">
        <div
          className="px-6 py-5"
          style={{
            backgroundColor: 'rgba(31,58,45,0.04)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              lineHeight: 1.8,
              color: 'var(--color-text-muted)',
            }}
          >
            Our full terms and conditions are being prepared. The key policies around orders,
            returns, and shipping are available in our{' '}
            <Link href="/faq" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>
              FAQ
            </Link>
            . For any specific questions, please contact us directly.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <h2
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-green)',
            }}
          >
            Orders
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
            By placing an order on thepossah.com, you confirm that the information you provide is accurate. We reserve the right to cancel orders at our discretion and will issue a full refund in such cases.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-green)',
            }}
          >
            Returns &amp; refunds
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
            We accept returns within 7 days of delivery for ready-to-ship items in original condition. Made-to-Measure orders are non-refundable. Shipping costs for returns are borne by the customer unless the return is due to a fault on our part.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-green)',
            }}
          >
            Made-to-measure
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
            Custom pieces are crafted specifically to your measurements. These cannot be returned or exchanged. We offer one complimentary alteration within 30 days of delivery. Bespoke orders require a deposit at the time of booking.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-green)',
            }}
          >
            Intellectual property
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
            All content on this website — including images, designs, text, and the Possah brand — is the intellectual property of The Possah Haute Couture. Reproduction without written permission is prohibited.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-green)',
            }}
          >
            Governing law
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
            These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.
          </p>
        </section>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            marginTop: 8,
          }}
        >
          Last updated: June 2026. Full legal terms will be published shortly.
        </p>
      </div>
    </div>
  )
}
