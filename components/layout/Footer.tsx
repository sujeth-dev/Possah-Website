import Link from 'next/link'
import { BrandLockup } from './BrandLockup'

/* ── Atelier address (single source of truth) ─────────────────────────────── */
const ATELIER_ADDRESS_LINES = [
  'Shop No. 1, Ground Floor, No. 30',
  '1st Main Road, Munireddy Layout',
  'Horamavu, Bengaluru, Karnataka 560113',
] as const

/* ── Link groups ──────────────────────────────────────────────────────────── */
const SHOP_LINKS = [
  { label: 'New In',       href: '/women/sarees?sort=newest' },
  { label: 'Best Sellers', href: '/best-sellers'            },
  { label: 'Bridal',       href: '/bridal'                  },
  { label: 'Festive',      href: '/festive'                 },
  { label: 'Lookbook',     href: '/lookbook'                },
  { label: 'Made-to-Measure', href: '/made-to-measure'      },
] as const

const ETHNIC_LINKS = [
  { label: 'Sarees',         href: '/women/sarees'         },
  { label: 'Lehengas',       href: '/women/lehengas'       },
  { label: 'Kurta Sets',     href: '/women/kurta-sets'     },
  { label: 'Dress Material', href: '/women/dress-material' },
  { label: 'Fabrics',        href: '/women/fabrics'        },
  { label: 'Blouses',        href: '/women/blouses'        },
] as const

const WESTERN_LINKS = [
  { label: 'Co-Ords', href: '/women/co-ords' },
  { label: 'Dresses', href: '/women/dresses' },
  { label: 'Tops',    href: '/women/tops'    },
  { label: 'Bottoms', href: '/women/bottoms' },
] as const

const HELP_LINKS = [
  { label: 'Contact',             href: '/contact'         },
  { label: 'FAQ',                 href: '/faq'             },
  { label: 'Shipping & Returns',  href: '/faq#faq-shipping-&-delivery' },
  { label: 'Size Guide',          href: '/size-guide'      },
  { label: 'Track Order',         href: '/account/orders'  },
] as const

const ABOUT_LINKS = [
  { label: 'Our Story', href: '/about'                    },
  { label: 'Atelier',   href: '/about#atelier'            },
  { label: 'Journal',   href: '/journal'                  },
  { label: 'Press',     href: '/contact?subject=press'    },
  { label: 'Careers',   href: '/contact?subject=careers'  },
] as const

/* ── Sub-components ───────────────────────────────────────────────────────── */

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-5"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        letterSpacing: '0.18em',
        color: 'var(--color-bg)',
      }}
    >
      {children}
    </h3>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'rgba(244,236,223,0.55)',
      }}
    >
      {children}
    </p>
  )
}

function LinkList({ links }: { links: readonly { label: string; href: string }[] }) {
  return (
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="hover:opacity-60 transition-opacity duration-200 block"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              lineHeight: 1.5,
              color: 'var(--color-bg)',
            }}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/* ── Main ──────────────────────────────────────────────────────────────────── */

export function Footer() {
  return (
    <footer
      style={{ backgroundColor: 'var(--color-green)', color: 'var(--color-bg)' }}
      aria-label="Site footer"
    >
      <div className="container-site py-16 md:py-20">
        {/*
          Layout:
            • Mobile (2 cols):      SHOP | HELP
                                    CATEGORIES (full row, internal 2-col matrix)
                                    ABOUT (single col, rest of last row)
            • Desktop (5 cols):     SHOP | CATEGORIES (col-span-2 matrix) | HELP | ABOUT
        */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-12 md:gap-y-10">

          {/* SHOP — order 1 mobile, 1 desktop */}
          <div className="order-1 md:order-1">
            <ColumnHeading>SHOP</ColumnHeading>
            <LinkList links={SHOP_LINKS} />
          </div>

          {/* HELP — order 2 mobile (so it sits next to SHOP), 4 desktop */}
          <div className="order-2 md:order-4">
            <ColumnHeading>HELP</ColumnHeading>
            <LinkList links={HELP_LINKS} />
          </div>

          {/* CATEGORIES matrix — full row on mobile, span 2 on desktop */}
          <div className="order-3 md:order-2 col-span-2 md:col-span-2">
            <ColumnHeading>CATEGORIES</ColumnHeading>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <SubHeading>Ethnic</SubHeading>
                <LinkList links={ETHNIC_LINKS} />
              </div>
              <div>
                <SubHeading>Western</SubHeading>
                <LinkList links={WESTERN_LINKS} />
              </div>
            </div>
          </div>

          {/* ABOUT — order 4 mobile (sits below categories), 5 desktop */}
          <div className="order-4 md:order-5 col-span-2 md:col-span-1">
            <ColumnHeading>ABOUT</ColumnHeading>
            <LinkList links={ABOUT_LINKS} />
          </div>
        </div>

        <div className="mt-14 mb-10 border-t" style={{ borderColor: 'rgba(244,236,223,0.15)' }} />

        {/* Brand + atelier address + social + payments */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">

          {/* Brand + atelier address */}
          <div className="flex flex-col items-center md:items-start gap-3 max-w-md text-center md:text-left">
            <BrandLockup variant="footer" />
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.2em',
                opacity: 0.6,
              }}
            >
              HAUTE COUTURE
            </p>
            <address
              className="not-italic"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                lineHeight: 1.6,
                color: 'var(--color-bg)',
                opacity: 0.75,
                marginTop: 4,
              }}
            >
              {ATELIER_ADDRESS_LINES.map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
              <a
                href="mailto:hello@thepossah.com"
                className="block mt-2 hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-bg)', textDecoration: 'none', opacity: 0.85 }}
              >
                hello@thepossah.com
              </a>
            </address>
          </div>

          {/* Social */}
          <div className="flex flex-col items-center md:items-end gap-4">
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

            <div className="flex items-center gap-2 opacity-70">
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  opacity: 0.85,
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
        </div>

        <div
          className="mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderColor: 'rgba(244,236,223,0.1)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              opacity: 0.5,
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
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  opacity: 0.5,
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
