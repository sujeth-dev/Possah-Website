'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface ProductListActionsProps {
  productId: string
  isActive: boolean
}

export function ProductListActions({ productId, isActive }: ProductListActionsProps) {
  const [active, setActive]   = useState(isActive)
  const [deleting, setDeleting] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  async function toggleActive() {
    const next = !active
    setActive(next)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      })
      if (!res.ok) {
        // Revert on failure
        setActive(active)
        console.error('[ProductListActions] toggle failed')
      } else {
        startTransition(() => router.refresh())
      }
    } catch {
      setActive(active)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Deactivate this product? It will be hidden from the shop.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        startTransition(() => router.refresh())
      } else {
        console.error('[ProductListActions] delete failed')
        setDeleting(false)
      }
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Active toggle */}
      <button
        onClick={toggleActive}
        disabled={pending}
        className="flex items-center gap-2 cursor-pointer"
        aria-label={active ? 'Deactivate product' : 'Activate product'}
        aria-pressed={active}
        type="button"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: pending ? 'not-allowed' : 'pointer',
          opacity: pending ? 0.6 : 1,
        }}
      >
        {/* Toggle pill */}
        <span
          className="relative inline-flex items-center"
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            backgroundColor: active ? 'var(--color-green)' : 'var(--color-border)',
            transition: 'background-color 0.2s',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: active ? 16 : 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: 'var(--color-white)',
              transition: 'left 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          />
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: active ? 'var(--color-green)' : 'var(--color-text-muted)',
          }}
        >
          {active ? 'Live' : 'Hidden'}
        </span>
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting || pending}
        type="button"
        className="hover:opacity-70 transition-opacity"
        aria-label="Delete product"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: deleting || pending ? 'not-allowed' : 'pointer',
          opacity: deleting || pending ? 0.4 : 1,
          color: 'var(--color-error)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
          <path d="M3 4h10M6 4V2h4v2M5 4l1 10h4l1-10" />
        </svg>
      </button>
    </div>
  )
}
