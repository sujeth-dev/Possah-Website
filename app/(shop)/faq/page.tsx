import type { Metadata } from 'next'
import { AccordionItem, AccordionGroup } from '@/components/ui/Accordion'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about orders, shipping, returns, and made-to-measure at The Possah.',
  alternates: { canonical: 'https://thepossah.com/faq' },
}

const FAQ_SECTIONS = [
  {
    heading: 'Orders & Payments',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards, UPI, net banking, and wallets through Razorpay. All transactions are 256-bit SSL encrypted.',
      },
      {
        q: 'Can I modify or cancel my order?',
        a: 'Orders can be cancelled within 2 hours of placement by contacting us on WhatsApp. After that, the order enters production and cannot be modified.',
      },
      {
        q: 'I didn\'t receive an order confirmation email — what do I do?',
        a: 'Check your spam/promotions folder first. If it\'s not there, WhatsApp us with your name and mobile number and we\'ll resend confirmation.',
      },
    ],
  },
  {
    heading: 'Shipping & Delivery',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 5–7 business days. Express delivery (available at checkout) takes 2–3 business days. Made-to-Measure pieces ship within 15–21 days.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently we ship within India only. International shipping is coming soon — sign up to our newsletter to be notified.',
      },
      {
        q: 'When does free shipping apply?',
        a: 'All orders above ₹2,500 qualify for free standard shipping.',
      },
    ],
  },
  {
    heading: 'Returns & Exchanges',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 7 days of delivery for unused pieces in original packaging with tags intact. Made-to-Measure orders are non-refundable.',
      },
      {
        q: 'How do I initiate a return?',
        a: 'WhatsApp us your order number and reason for return. We\'ll send a prepaid return label within 24 hours.',
      },
      {
        q: 'How long does a refund take?',
        a: 'Once we receive and inspect the returned item, refunds are processed within 5–7 business days to the original payment method.',
      },
    ],
  },
  {
    heading: 'Made-to-Measure',
    items: [
      {
        q: 'How does the Made-to-Measure process work?',
        a: 'You choose a piece, share your measurements via our guide, pick your fabric and finish preferences — and we handcraft your piece in 15–21 days. Visit the Made-to-Measure page for the full process.',
      },
      {
        q: 'Can I get a bespoke design not in your catalogue?',
        a: 'Yes. Reach us on WhatsApp with your inspiration — mood boards, sketches, anything helps — and our atelier will work with you on a fully custom creation.',
      },
      {
        q: 'Are Made-to-Measure orders refundable?',
        a: 'No. Because each piece is made specifically to your measurements and specifications, we cannot accept returns on Made-to-Measure orders. We do offer one complimentary alteration within 30 days of delivery.',
      },
    ],
  },
]

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_SECTIONS.flatMap(({ items }) =>
      items.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      }))
    ),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    <div className="container-site py-16 pb-24 max-w-[800px] mx-auto">
      <p className="section-label mb-4">HELP</p>
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
        Frequently Asked Questions
      </h1>

      <div className="flex flex-col gap-10">
        {FAQ_SECTIONS.map(({ heading, items }) => (
          <section key={heading} aria-labelledby={`faq-${heading.toLowerCase().replace(/ /g, '-')}`}>
            <h2
              id={`faq-${heading.toLowerCase().replace(/ /g, '-')}`}
              className="mb-4"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--color-green)',
              }}
            >
              {heading}
            </h2>
            <AccordionGroup>
              {items.map(({ q, a }) => (
                <AccordionItem key={q} title={q}>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      lineHeight: 1.8,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {a}
                  </p>
                </AccordionItem>
              ))}
            </AccordionGroup>
          </section>
        ))}
      </div>

      <div
        className="mt-16 p-6 flex flex-col items-start gap-3"
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          backgroundColor: 'rgba(31,58,45,0.03)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          STILL HAVE QUESTIONS?
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text)' }}>
          We&rsquo;re here to help. Reach us any time on WhatsApp or email.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity duration-200"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-green)',
          }}
        >
          Contact Us →
        </Link>
      </div>
    </div>
    </>
  )
}
