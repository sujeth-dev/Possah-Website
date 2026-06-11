'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

interface NavChild {
  label: string
  href: string
}

interface NavSubmenuSection {
  label: string
  href: string
  children: readonly NavChild[]
}

interface NavItem {
  label: string
  href: string
  submenu?: readonly NavSubmenuSection[]
}

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  navItems: readonly NavItem[]
}

export function MobileNav({ isOpen, onClose, navItems }: MobileNavProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'var(--color-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-y-0 left-0 z-50 w-[min(320px,90vw)] flex flex-col transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Header row */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            MENU
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity"
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l16 16M17 1L1 17" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4" aria-label="Mobile navigation">
          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-black/5 transition-colors duration-150"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '0.06em',
                    color: 'var(--color-text)',
                  }}
                >
                  {item.label}
                  {item.submenu && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M5 2l5 5-5 5" />
                    </svg>
                  )}
                </Link>

                {/* Submenu items inline */}
                {item.submenu && (
                  <ul className="pl-6 pb-2">
                    {item.submenu.map((section) => (
                      <li key={section.label}>
                        <span
                          className="block px-2 pt-3 pb-1"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {section.label}
                        </span>
                        <ul>
                          {section.children.map((child) => (
                            <li key={child.label}>
                              <Link
                                href={child.href}
                                onClick={onClose}
                                className="block px-2 py-2 hover:opacity-60 transition-opacity duration-150"
                                style={{
                                  fontFamily: 'var(--font-body)',
                                  fontSize: '13px',
                                  color: 'var(--color-text)',
                                }}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer links */}
        <div
          className="px-6 py-5 border-t space-y-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Link
            href="/account"
            onClick={onClose}
            className="flex items-center gap-3 hover:opacity-70 transition-opacity"
            style={{ fontSize: '13px', color: 'var(--color-text)' }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="10" cy="7" r="3.5" />
              <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" />
            </svg>
            My Account
          </Link>
          <Link
            href="/account/orders"
            onClick={onClose}
            className="flex items-center gap-3 hover:opacity-70 transition-opacity"
            style={{ fontSize: '13px', color: 'var(--color-text)' }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h14l-1.5 10a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 6z" />
              <path d="M7 6V4a3 3 0 0 1 6 0v2" />
            </svg>
            My Orders
          </Link>
          <Link
            href="/wishlist"
            onClick={onClose}
            className="flex items-center gap-3 hover:opacity-70 transition-opacity"
            style={{ fontSize: '13px', color: 'var(--color-text)' }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 17.5S2 12.5 2 6.5a4 4 0 018-1.3A4 4 0 0118 6.5c0 6-8 11-8 11z" />
            </svg>
            Wishlist
          </Link>
          <Link
            href="/contact"
            onClick={onClose}
            className="flex items-center gap-3 hover:opacity-70 transition-opacity"
            style={{ fontSize: '13px', color: 'var(--color-text)' }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="2" y="4" width="16" height="12" rx="1" />
              <path d="M2 7l8 5 8-5" />
            </svg>
            Contact
          </Link>
        </div>
      </div>
    </>
  )
}
