import Link from 'next/link'
import Image from 'next/image'

const FOOTER_COLUMNS = [
  {
    heading: 'SHOP',
    links: [
      { label: 'New In', href: '/shop/sarees?sort=newest' },
      { label: 'Ethnic', href: '/shop/sarees' },
      { label: 'Western', href: '/shop/co-ords' },
      { label: 'Bridal', href: '/bridal' },
      { label: 'Festive', href: '/festive' },
      { label: 'Ready to Ship', href: '/shop/sarees?filter=ready-to-ship' },
    ],
  },
  {
    heading: 'CATEGORIES',
    links: [
      { label: 'Sarees', href: '/shop/sarees' },
      { label: 'Lehengas', href: '/shop/lehengas' },
      { label: 'Co-Ords', href: '/shop/co-ords' },
      { label: 'Dresses', href: '/shop/dresses' },
      { label: 'Kurta Sets', href: '/shop/kurta-sets' },
      { label: 'Separates', href: '/shop/separates' },
    ],
  },
  {
    heading: 'HELP',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Shipping & Returns', href: '/faq#shipping' },
      { label: 'Size Guide', href: '/size-guide' },
      { label: 'Track Order', href: '/account' },
    ],
  },
  {
    heading: 'ABOUT',
    links: [
      { label: 'Our Story', href: '/about' },
      { label: 'Atelier', href: '/about#atelier' },
      { label: 'Journal', href: '/journal' },
      { label: 'Press', href: '/contact?subject=press' },
      { label: 'Careers', href: '/contact?subject=careers' },
    ],
  },
]

export function Footer() {
  return (
    <footer
      style={{ backgroundColor: 'var(--color-green)', color: 'var(--color-bg)' }}
      aria-label="Site footer"
    >
      {/* Main footer grid */}
      <div className="container-site py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3
                className="mb-5"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-label)',
                  letterSpacing: '0.2em',
                  opacity: 0.6,
                }}
              >
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:opacity-70 transition-opacity duration-200 block"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        lineHeight: 1.5,
                        color: 'var(--color-bg)',
                        opacity: 0.85,
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-14 mb-10 border-t" style={{ borderColor: 'rgba(244,236,223,0.15)' }} />

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo-wordmark-cream.png"
                alt="The Possah"
                width={140}
                height={32}
                style={{ height: '28px', width: 'auto', opacity: 0.9 }}
              />
            </div>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.25em',
                opacity: 0.45,
              }}
            >
              HAUTE COUTURE · LUCKNOW
            </p>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-5">
            <a
              href="https://instagram.com/thepossah"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Possah on Instagram"
              className="opacity-70 hover:opacity-100 transition-opacity duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://pinterest.com/thepossah"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Possah on Pinterest"
              className="opacity-70 hover:opacity-100 transition-opacity duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.641 1.267 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.136-1.866 3.136-4.561 0-2.385-1.715-4.052-4.163-4.052-2.836 0-4.498 2.127-4.498 4.325 0 .856.33 1.773.741 2.274a.3.3 0 01.069.284c-.076.313-.243.995-.275 1.134-.044.183-.146.222-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
              </svg>
            </a>
            <a
              href="https://youtube.com/@thepossah"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Possah on YouTube"
              className="opacity-70 hover:opacity-100 transition-opacity duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>

          {/* Payment badges */}
          <div className="flex items-center gap-2 opacity-60">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.15em',
                opacity: 0.7,
              }}
            >
              SECURE PAYMENTS:
            </span>
            <div className="flex items-center gap-2">
              {['VISA', 'MC', 'UPI', 'GP'].map((badge) => (
                <span
                  key={badge}
                  className="px-1.5 py-0.5 border rounded-sm"
                  style={{
                    borderColor: 'rgba(244,236,223,0.25)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Legal row */}
        <div
          className="mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderColor: 'rgba(244,236,223,0.1)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              opacity: 0.4,
            }}
          >
            © {new Date().getFullYear()} THE POSSAH HAUTE COUTURE. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-5">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Updates', href: '/journal' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:opacity-70 transition-opacity duration-200"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  opacity: 0.4,
                  color: 'var(--color-bg)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
