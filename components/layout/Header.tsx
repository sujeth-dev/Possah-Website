'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cartStore'
import { useWishlistStore } from '@/lib/store/wishlistStore'
import { MobileNav } from './MobileNav'

const NAV_ITEMS = [
  { label: 'NEW IN', href: '/new-in' },
  {
    label: 'WOMEN',
    href: '/women',
    submenu: [
      { label: 'Ethnic', children: [
        { label: 'Sarees',        href: '/shop/sarees'         },
        { label: 'Lehengas',      href: '/shop/lehengas'       },
        { label: 'Kurta Sets',    href: '/shop/kurta-sets'     },
        { label: 'Dress Material',href: '/shop/dress-material' },
        { label: 'Fabrics',       href: '/shop/fabrics'        },
        { label: 'Blouses',       href: '/shop/blouses'        },
      ], splitAt: 3 },
      { label: 'Western', children: [
        { label: 'Co-Ords',  href: '/shop/co-ords'  },
        { label: 'Dresses',  href: '/shop/dresses'  },
        { label: 'Tops',     href: '/shop/tops'     },
        { label: 'Bottoms',  href: '/shop/bottoms'  },
      ]},
    ],
  },
  { label: 'BEST SELLERS', href: '/best-sellers' },
  { label: 'BRIDAL',       href: '/bridal'       },
  { label: 'FESTIVE',      href: '/festive'      },
  { label: 'ABOUT',        href: '/about'        },
] as const

type NavItem = (typeof NAV_ITEMS)[number]

export function Header() {
  const [mobileNavOpen, setMobileNavOpen]   = useState(false)
  const [openMenu, setOpenMenu]             = useState<string | null>(null)
  const [scrolled, setScrolled]             = useState(false)
  const [mounted, setMounted]               = useState(false)
  const closeTimer                          = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cartCount     = useCartStore((s) => s.itemCount())
  const wishlistCount = useWishlistStore((s) => s.count())

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenu(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleMouseEnter(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenMenu(label)
  }

  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120)
  }

  const activeItem = NAV_ITEMS.find((i) => i.label === openMenu && 'submenu' in i) as
    | (NavItem & { submenu: readonly { label: string; children: readonly { label: string; href: string }[] }[] })
    | undefined

  // For MobileNav we need a compatible type — add href to submenu sections
  const mobileNavItems = NAV_ITEMS.map((item) => ({
    label: item.label,
    href: item.href,
    submenu: 'submenu' in item
      ? item.submenu.map((section) => ({
          label: section.label,
          href: section.children[0]?.href ?? item.href,
          children: section.children.map((c) => ({ label: c.label, href: c.href })),
        }))
      : undefined,
  }))

  return (
    <>
      <header
        style={{ backgroundColor: 'var(--color-bg)' }}
        className={`sticky top-0 z-40 w-full transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.08)]' : 'border-b border-[var(--color-border)]'
        }`}
      >
        <div className="relative flex items-center justify-between h-16 md:h-[72px] px-4 md:px-8 max-w-[1440px] mx-auto">

          {/* ── Mobile: hamburger ── */}
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
          <Link
            href="/search"
            className="hidden md:flex items-center gap-2 text-[11px] tracking-widest uppercase hover:opacity-70 transition-opacity duration-200"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7.5" cy="7.5" r="5.5" />
              <path d="M13 13l3.5 3.5" />
            </svg>
          </Link>

          {/* ── Logo (centred) ── */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            {/* Desktop: logo symbol + brand name side-by-side */}
            <Link href="/" aria-label="The Possah — Home" className="hidden md:flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt=""
                width={56}
                height={56}
                priority
                className="object-contain flex-shrink-0"
                style={{ height: '52px', width: 'auto' }}
              />
              {/* Crop transparent padding: show only text content area */}
              <div style={{ height: '42px', overflow: 'hidden', flexShrink: 0 }}>
                <Image
                  src="/images/name.png"
                  alt="The Possah"
                  width={256}
                  height={171}
                  priority
                  style={{ height: '95px', width: 'auto', marginTop: '-30px' }}
                />
              </div>
            </Link>
            {/* Mobile */}
            <Link href="/" aria-label="The Possah — Home" className="flex md:hidden items-center gap-2">
              <Image
                src="/images/logo.png"
                alt=""
                width={40}
                height={40}
                priority
                className="object-contain flex-shrink-0"
                style={{ height: '36px', width: 'auto' }}
              />
              {/* Crop transparent padding: show only text content area */}
              <div style={{ height: '32px', overflow: 'hidden', flexShrink: 0 }}>
                <Image
                  src="/images/name.png"
                  alt="The Possah"
                  width={256}
                  height={171}
                  priority
                  style={{ height: '72px', width: 'auto', marginTop: '-23px' }}
                />
              </div>
            </Link>
          </div>

          {/* ── Right icons ── */}
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/search" className="md:hidden flex items-center justify-center w-8 h-8" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7.5" cy="7.5" r="5.5" />
                <path d="M13 13l3.5 3.5" />
              </svg>
            </Link>
            <Link
              href="/wishlist"
              className="hidden md:flex items-center justify-center w-8 h-8 relative"
              aria-label={mounted && wishlistCount > 0 ? `Wishlist — ${wishlistCount} items` : 'Wishlist'}
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
            <Link href="/account" className="hidden md:flex items-center justify-center w-8 h-8" aria-label="My Account">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="7" r="3.5" />
                <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" />
              </svg>
            </Link>
            <Link
              href="/cart"
              className="flex items-center justify-center w-8 h-8 relative"
              aria-label={mounted && cartCount > 0 ? `Shopping bag — ${cartCount} items` : 'Shopping bag'}
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
          <ul className="flex items-center gap-8" role="menubar">
            {NAV_ITEMS.map((item) => {
              const hasSubmenu = 'submenu' in item
              const isOpen     = openMenu === item.label

              return (
                <li
                  key={item.label}
                  role="none"
                  onMouseEnter={() => handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                  className="relative"
                >
                  <Link
                    href={item.href}
                    role="menuitem"
                    aria-haspopup={hasSubmenu ? 'true' : undefined}
                    aria-expanded={hasSubmenu ? isOpen : undefined}
                    onClick={() => setOpenMenu(null)}
                    className="inline-flex items-center gap-1 h-10 hover:opacity-60 transition-opacity duration-200 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--color-green)] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      fontWeight: '500',
                      letterSpacing: '0.08em',
                      color: 'var(--color-text)',
                    }}
                  >
                    {item.label}
                    {hasSubmenu && (
                      <svg
                        width="8" height="8" viewBox="0 0 8 8" fill="none"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      >
                        <path d="M1 2.5l3 3 3-3" />
                      </svg>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── Dropdown panel ── */}
        {activeItem && (
          <div
            role="region"
            aria-label={`${activeItem.label} submenu`}
            onMouseEnter={() => handleMouseEnter(activeItem.label)}
            onMouseLeave={handleMouseLeave}
            className="hidden md:block absolute left-0 right-0 z-50 border-t border-b"
            style={{
              top: '100%',
              backgroundColor: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.07)',
              animation: 'dropdownIn 0.18s ease',
            }}
          >
            <div className="max-w-[1440px] mx-auto px-8 py-8 flex items-start gap-16">
              {activeItem.submenu.map((section) => {
                const split = (section as typeof section & { splitAt?: number }).splitAt
                if (split) {
                  // Render as two side-by-side columns under one shared label
                  const col1 = section.children.slice(0, split)
                  const col2 = section.children.slice(split)
                  return (
                    <div key={section.label} className="flex gap-8">
                      <div className="min-w-[120px]">
                        <p
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: 'var(--color-text-muted)',
                            marginBottom: '12px',
                          }}
                        >
                          {section.label}
                        </p>
                        <ul className="flex flex-col gap-3">
                          {col1.map((child) => (
                            <li key={child.label}>
                              <Link
                                href={child.href}
                                onClick={() => setOpenMenu(null)}
                                style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: '400', color: 'var(--color-text)', letterSpacing: '0.02em', textDecoration: 'none', display: 'block' }}
                                className="hover:opacity-55 transition-opacity duration-150"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="min-w-[120px] mt-[25px]">
                        <ul className="flex flex-col gap-3">
                          {col2.map((child) => (
                            <li key={child.label}>
                              <Link
                                href={child.href}
                                onClick={() => setOpenMenu(null)}
                                style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: '400', color: 'var(--color-text)', letterSpacing: '0.02em', textDecoration: 'none', display: 'block' }}
                                className="hover:opacity-55 transition-opacity duration-150"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                }
                return (
                <div key={section.label} className="min-w-[120px]">
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-muted)',
                      marginBottom: '12px',
                    }}
                  >
                    {section.label}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {section.children.map((child) => (
                      <li key={child.label}>
                        <Link
                          href={child.href}
                          onClick={() => setOpenMenu(null)}
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '14px',
                            fontWeight: '400',
                            color: 'var(--color-text)',
                            letterSpacing: '0.02em',
                            textDecoration: 'none',
                            display: 'block',
                          }}
                          className="hover:opacity-55 transition-opacity duration-150"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                )
              })}

              {/* Right side — women page link */}
              <div className="ml-auto self-center">
                <Link
                  href="/women"
                  onClick={() => setOpenMenu(null)}
                  className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity duration-150"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    textDecoration: 'none',
                  }}
                >
                  Shop all Women
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 5h6M5 2l3 3-3 3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Dropdown animation keyframe */}
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      {/* Mobile navigation drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navItems={mobileNavItems}
      />
    </>
  )
}
