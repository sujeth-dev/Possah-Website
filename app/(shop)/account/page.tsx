import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'My Account',
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev
    ? { user: { name: 'Dev User', email: 'dev@thepossah.com', image: null } }
    : await getServerSession(authOptions)

  if (!session) {
    return (
      <div className="container-site py-24 flex flex-col items-center gap-6 text-center max-w-[480px] mx-auto">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          Sign in to continue.
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          View your orders, saved addresses, and more.
        </p>
        <Link
          href="/auth/signin?callbackUrl=%2Faccount"
          className="inline-flex items-center justify-center gap-2 px-10 py-3.5 transition-opacity duration-200 hover:opacity-80"
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
          Sign In with Google
        </Link>
      </div>
    )
  }

  const ACCOUNT_LINKS = [
    { href: '/account/orders', label: 'My Orders', sub: 'Track, view, or return your orders' },
    { href: '/wishlist',       label: 'Wishlist',   sub: 'Pieces you\'ve saved for later' },
    { href: '/made-to-measure', label: 'Made-to-Measure Enquiries', sub: 'Track your bespoke orders' },
    { href: '/size-guide',     label: 'Size Guide',  sub: 'Find your perfect fit' },
  ]

  return (
    <div className="container-site py-12 pb-24">
      {/* Greeting */}
      <div className="mb-10">
        <p className="section-label mb-2">WELCOME BACK</p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          {session.user?.name ?? 'Hello'}
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', marginTop: 4 }}>
          {session.user?.email}
        </p>
      </div>

      {/* Links grid */}
      <div className="grid sm:grid-cols-2 gap-4 max-w-[640px]">
        {ACCOUNT_LINKS.map(({ href, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-1 p-5 transition-all duration-150 hover:opacity-80 group"
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontWeight: '500',
                color: 'var(--color-text)',
              }}
            >
              {label} →
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {sub}
            </span>
          </Link>
        ))}
      </div>

      {/* Sign out */}
      {!isDev && (
        <Link
          href="/api/auth/signout"
          className="mt-10 inline-flex items-center hover:opacity-60 transition-opacity duration-200"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}
        >
          Sign Out
        </Link>
      )}
    </div>
  )
}
