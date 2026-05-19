import type { Metadata } from 'next'
import { whatsappUrl } from '@/lib/utils'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact — The Possah',
  description: 'Get in touch with The Possah for orders, bespoke enquiries, or just to talk about craft.',
  alternates: { canonical: 'https://thepossah.com/contact' },
}

export default function ContactPage() {
  const waLink = whatsappUrl('+919876543210', 'Hi! I have a question about The Possah.')

  return (
    <div className="container-site py-16 pb-24">
      {/* Heading */}
      <div className="max-w-[560px] mb-14">
        <p className="section-label mb-3">REACH US</p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 64px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          We&rsquo;d love to hear from you.
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        {/* Left: contact options */}
        <div className="flex flex-col gap-8">
          {/* WhatsApp */}
          <div className="flex flex-col gap-2">
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
              }}
            >
              WHATSAPP (FASTEST)
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity duration-200"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                color: 'var(--color-text)',
              }}
            >
              +91 98765 43210
            </a>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Replies within 2 hours, 10am–8pm IST
            </p>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
              }}
            >
              EMAIL
            </p>
            <a
              href="mailto:hello@thepossah.com"
              className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity duration-200"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                color: 'var(--color-text)',
              }}
            >
              hello@thepossah.com
            </a>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              For orders, bespoke enquiries & wholesale
            </p>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-2">
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
              }}
            >
              ATELIER
            </p>
            <address
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'var(--color-text)',
                lineHeight: 1.7,
                fontStyle: 'normal',
              }}
            >
              The Possah Atelier<br />
              Hazratganj, Lucknow<br />
              Uttar Pradesh — 226001
            </address>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              By appointment only — please WhatsApp to schedule
            </p>
          </div>
        </div>

        {/* Right: contact form */}
        <ContactForm />
      </div>
    </div>
  )
}
