'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cartStore'
import { useWishlistStore } from '@/lib/store/wishlistStore'
import { MobileNav } from './MobileNav'

const NAV_ITEMS = [
  { label: 'NEW IN', href: '/shop/sarees?sort=newest' },
  {
    label: 'WOMEN',
    href: '/shop/sarees',
    submenu: [
      { label: 'Ethnic', href: '/shop/sarees', children: [
        { label: 'Sarees', href: '/shop/sarees' },
        { label: 'Lehengas', href: '/shop/lehengas' },
        { label: 'Kurta Sets', href: '/shop/kurta-sets' },
      ]},
      { label: 'Western', href: '/shop/co-ords', children: [
        { label: 'Co-Ords', href: '/shop/co-ords' },
        { label: 'Dresses', href: '/shop/dresses' },
        { label: 'Separates', href: '/shop/separates' },
      ]},
    ],
  },
  { label: 'BRIDAL', href: '/bridal' },
  { label: 'FESTIVE', href: '/festive' },
  { label: 'READY-TO-SHIP', href: '/shop/sarees?sort=newest' },
  { label: 'ABOUT', href: '/about' },
] as const

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const cartCount = useCartStore((s) => s.itemCount())
  const wishlistCount = useWishlistStore((s) => s.count())

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        style={{ backgroundColor: 'var(--color-bg)' }}
        className={`sticky top-0 z-40 w-full transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.08)]' : 'border-b border-[var(--color-border)]'
        }`}
      >
        <div className="relative flex items-center justify-between h-16 md:h-[64px] px-4 md:px-8 max-w-[1440px] mx-auto">

          {/* ── Mobile: hamburger (left) ── */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden flex items-center justify-center w-10 h-10 -ml-2"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
          >
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M0 1h22M0 8h22M0 15h22" />
            </svg>
          </button>

          {/* ── Desktop: search (left) ── */}
          <button
            className="hidden md:flex items-center gap-2 text-[11px] tracking-widest uppercase hover:opacity-70 transition-opacity duration-200"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7.5" cy="7.5" r="5.5" />
              <path d="M13 13l3.5 3.5" />
            </svg>
          </button>

          {/* ── Logo (centred absolutely on desktop) ── */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            {/* Desktop: image + name */}
            <Link href="/" aria-label="The Possah — Home" className="hidden md:flex items-center">
              <Image
                src="/images/logo-gradient.png"
                alt="The Possah"
                width={200}
                height={80}
                priority
                className="object-contain"
                style={{ height: '120px', width: 'auto' }}
              />
            </Link>
            {/* Mobile: symbol + name */}
            <Link href="/" aria-label="The Possah — Home" className="flex md:hidden items-center gap-2">
              <Image
                src="/images/logo-symbol.png"
                alt="The Possah"
                width={52}
                height={52}
                priority
                className="object-contain"
                style={{ height: '120px', width: 'auto' }}
              />
            </Link>
          </div>

          {/* ── Desktop: nav links ── */}
          <nav className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 mt-8 pt-[64px]"
            style={{ top: '0', marginTop: '0', paddingTop: '0' }}
          >
            {/* Nav is BELOW the logo row — separate from the centred logo */}
          </nav>

          {/* ── Right icons ── */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search — mobile only */}
            <Link
              href="/search"
              className="md:hidden flex items-center justify-center w-8 h-8"
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7.5" cy="7.5" r="5.5" />
                <path d="M13 13l3.5 3.5" />
              </svg>
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="hidden md:flex items-center justify-center w-8 h-8 relative"
              aria-label={`Wishlist${wishlistCount > 0 ? ` — ${wishlistCount} items` : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 17.5S2 12.5 2 6.5a4 4 0 018-1.3A4 4 0 0118 6.5c0 6-8 11-8 11z" />
              </svg>
              {mounted && wishlistCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] rounded-full px-1"
                  style={{ backgroundColor: 'var(--color-orange)', color: 'var(--color-white)', fontFamily: 'var(--font-mono)' }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              href="/account"
              className="hidden md:flex items-center justify-center w-8 h-8"
              aria-label="My Account"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="7" r="3.5" />
                <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" />
              </svg>
            </Link>

            {/* Cart / Bag */}
            <Link
              href="/cart"
              className="flex items-center justify-center w-8 h-8 relative"
              aria-label={`Shopping bag${cartCount > 0 ? ` — ${cartCount} items` : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 7V5a4 4 0 018 0v2" />
                <rect x="2" y="7" width="16" height="12" rx="1" />
              </svg>
              {mounted && cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] rounded-full px-1"
                  style={{ backgroundColor: 'var(--color-orange)', color: 'var(--color-white)', fontFamily: 'var(--font-mono)' }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ── Desktop: nav bar (below logo row) ── */}
        <nav
          className="hidden md:flex items-center justify-center border-t h-10"
          style={{ borderColor: 'var(--color-border)' }}
          aria-label="Primary navigation"
        >
          <ul className="flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-flex items-center h-10 hover:opacity-60 transition-opacity duration-200 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--color-green)] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: '500',
                    letterSpacing: '0.08em',
                    color: 'var(--color-text)',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navItems={NAV_ITEMS}
      />
    </>
  )
}
