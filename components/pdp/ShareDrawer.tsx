'use client'

import { useState, useEffect, useRef } from 'react'

interface ShareDrawerProps {
  url: string
  title: string
  image?: string
  description?: string
}

export function ShareDrawer({ url, title, image, description }: ShareDrawerProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url, text: description })
        return
      } catch {
        // user cancelled or browser unsupported — fall through to popover
      }
    }
    setOpen((v) => !v)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}${image ? `&media=${encodeURIComponent(image)}` : ''}${description ? `&description=${encodeURIComponent(description)}` : ''}`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-70"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: 'var(--color-text-muted)',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
        aria-label="Share this product"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13" cy="3" r="1.5" />
          <circle cx="13" cy="13" r="1.5" />
          <circle cx="3" cy="8" r="1.5" />
          <line x1="4.5" y1="7.2" x2="11.5" y2="3.8" />
          <line x1="4.5" y1="8.8" x2="11.5" y2="12.2" />
        </svg>
        Share
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 z-50 flex flex-col gap-1 rounded p-2 shadow-lg"
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            minWidth: 180,
            borderRadius: 'var(--radius-card)',
          }}
        >
          <button
            onClick={copyLink}
            className="flex items-center gap-2.5 px-3 py-2 rounded hover:opacity-80 transition-opacity text-left w-full"
            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-btn)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="4" width="8" height="9" rx="1.5" /><path d="M5 1h7a1 1 0 011 1v8" /></svg>
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 hover:opacity-80 transition-opacity"
            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)', textDecoration: 'none', borderRadius: 'var(--radius-btn)' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1C4.134 1 1 4.134 1 8c0 1.27.322 2.463.887 3.5L1 15l3.563-.876A6.966 6.966 0 008 15c3.866 0 7-3.134 7-7s-3.134-7-7-7z" stroke="currentColor" strokeWidth="1.2"/></svg>
            WhatsApp
          </a>

          <a
            href={pinterestUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 hover:opacity-80 transition-opacity"
            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)', textDecoration: 'none', borderRadius: 'var(--radius-btn)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
            Pinterest
          </a>
        </div>
      )}
    </div>
  )
}
