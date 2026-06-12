import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for The Possah — how we collect, use, and protect your information.',
  alternates: { canonical: 'https://thepossah.com/privacy' },
}

export default function PrivacyPage() {
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
        Privacy Policy
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
            Our full privacy policy is being prepared. In the meantime, if you have any questions
            about how we handle your personal information, please contact us directly.
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
            What we collect
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
            When you place an order or create an account, we collect your name, email address, phone number, and shipping address. We use this information solely to fulfil your orders and communicate with you about your purchases.
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
            Payments
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
            All payments are processed securely by Razorpay. We do not store your card details. Razorpay&rsquo;s privacy practices are governed by their own privacy policy.
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
            Your data
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
            We do not sell or share your personal information with third parties for marketing purposes. You may request access to, correction of, or deletion of your personal data by contacting us.
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
            Contact
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
            For any privacy-related questions, reach us at{' '}
            <Link
              href="/contact"
              style={{ color: 'var(--color-green)', textDecoration: 'underline' }}
            >
              our contact page
            </Link>
            .
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
          Last updated: June 2026. This policy will be updated with full legal language shortly.
        </p>
      </div>
    </div>
  )
}
