'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AddressCard, type SavedAddress } from '@/components/account/AddressCard'
import { AddressForm, type AddressFormValues } from '@/components/account/AddressForm'

export default function AddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/account/addresses')
      .then((r) => r.json())
      .then((d) => setAddresses(d.addresses ?? []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (values: AddressFormValues) => {
    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error((data as { error?: string }).error ?? 'Failed to save')
    }
    setAdding(false)
    router.refresh()
    // Re-fetch addresses
    const updated = await fetch('/api/account/addresses').then((r) => r.json())
    setAddresses(updated.addresses ?? [])
  }

  return (
    <div className="container-site py-12 pb-24 max-w-[680px]">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 mb-6 hover:opacity-60 transition-opacity duration-200"
        style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
      >
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 5h12M1 5L5 1M1 5l4 4" />
        </svg>
        My Account
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="section-label mb-1">ACCOUNT</p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
            }}
          >
            Saved Addresses
          </h1>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--color-green)',
              color: 'var(--color-white)',
              fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase',
              border: 'none', borderRadius: 'var(--radius-btn)', cursor: 'pointer',
            }}
          >
            + Add Address
          </button>
        )}
      </div>

      {adding && (
        <div
          className="p-5 mb-6"
          style={{ border: '1px solid var(--color-green)', borderRadius: 'var(--radius-card)' }}
        >
          <p className="mb-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-green)' }}>
            New Address
          </p>
          <AddressForm onSave={handleAdd} onCancel={() => setAdding(false)} />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-36 rounded animate-pulse"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
          ))}
        </div>
      ) : addresses.length === 0 && !adding ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded text-center gap-4"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            No saved addresses yet.
          </p>
          <button
            onClick={() => setAdding(true)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase',
              backgroundColor: 'var(--color-green)', color: 'var(--color-white)',
              border: 'none', borderRadius: 'var(--radius-btn)', padding: '10px 20px', cursor: 'pointer',
            }}
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {addresses.map((addr) => (
            <AddressCard key={addr.id} address={addr} />
          ))}
        </div>
      )}
    </div>
  )
}
