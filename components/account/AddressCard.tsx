'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AddressForm, type AddressFormValues } from './AddressForm'

export interface SavedAddress {
  id: string
  label: string | null
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pincode: string
  delivery_notes: string | null
  is_default: boolean
}

export function AddressCard({ address }: { address: SavedAddress }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [settingDefault, setSettingDefault] = useState(false)

  const handleSetDefault = async () => {
    setSettingDefault(true)
    await fetch(`/api/account/addresses/${address.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    })
    router.refresh()
    setSettingDefault(false)
  }

  const handleDelete = async () => {
    if (!confirm('Remove this address?')) return
    setDeleting(true)
    await fetch(`/api/account/addresses/${address.id}`, { method: 'DELETE' })
    router.refresh()
  }

  const handleSave = async (values: AddressFormValues) => {
    const res = await fetch(`/api/account/addresses/${address.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error((data as { error?: string }).error ?? 'Failed to save')
    }
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div
        className="p-5"
        style={{ border: '1px solid var(--color-green)', borderRadius: 'var(--radius-card)' }}
      >
        <p className="mb-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-green)' }}>
          Edit Address
        </p>
        <AddressForm
          initial={{
            label: address.label ?? '',
            full_name: address.full_name,
            phone: address.phone,
            address_line1: address.address_line1,
            address_line2: address.address_line2 ?? '',
            city: address.city,
            state: address.state as AddressFormValues['state'],
            pincode: address.pincode,
            delivery_notes: address.delivery_notes ?? '',
            is_default: address.is_default,
          }}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div
      className="p-5 flex flex-col gap-3"
      style={{
        border: `1px solid ${address.is_default ? 'var(--color-green)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-card)',
        position: 'relative',
      }}
    >
      {address.is_default && (
        <span
          style={{
            position: 'absolute', top: 12, right: 12,
            fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--color-green)', backgroundColor: 'rgba(31,58,45,0.08)',
            padding: '3px 8px', borderRadius: 4,
          }}
        >
          Default
        </span>
      )}

      {address.label && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          {address.label}
        </p>
      )}

      <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6 }}>
        <p style={{ fontWeight: 500 }}>{address.full_name}</p>
        <p>{address.address_line1}</p>
        {address.address_line2 && <p>{address.address_line2}</p>}
        <p>{address.city}, {address.state} – {address.pincode}</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{address.phone}</p>
        {address.delivery_notes && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: 4 }}>
            Note: {address.delivery_notes}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={() => setEditing(true)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-green)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Edit
        </button>
        {!address.is_default && (
          <button
            onClick={handleSetDefault}
            disabled={settingDefault}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: settingDefault ? 0.5 : 1 }}
          >
            {settingDefault ? 'Setting…' : 'Set as Default'}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-rose)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: deleting ? 0.5 : 1, marginLeft: 'auto' }}
        >
          {deleting ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </div>
  )
}
