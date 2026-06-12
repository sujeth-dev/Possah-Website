'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const

const schema = z.object({
  label: z.string().trim().max(40).optional(),
  full_name: z.string().trim().min(2, 'Name required').max(100).regex(/[a-zA-Z]/, 'Enter a valid name'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
  address_line1: z.string().trim().min(5, 'Address required').max(200),
  address_line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, 'City required').max(80).regex(/^[a-zA-Z\s\-.]+$/, 'Enter a valid city'),
  state: z.enum(INDIAN_STATES, { errorMap: () => ({ message: 'Select your state' }) }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter valid 6-digit pincode'),
  delivery_notes: z.string().trim().max(300).optional(),
  is_default: z.boolean().optional(),
})

export type AddressFormValues = z.infer<typeof schema>

interface Props {
  initial?: Partial<AddressFormValues>
  onSave: (values: AddressFormValues) => Promise<void>
  onCancel: () => void
  showDefaultToggle?: boolean
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-btn)',
  padding: '10px 12px',
  width: '100%',
}

const inputErrorStyle: React.CSSProperties = { ...inputStyle, border: '1px solid var(--color-rose)' }

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: error ? 'var(--color-rose)' : 'var(--color-text-muted)' }}>
        {label}
      </label>
      {children}
      {error && <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-rose)' }}>{error}</p>}
    </div>
  )
}

export function AddressForm({ initial, onSave, onCancel, showDefaultToggle = true }: Props) {
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<AddressFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: initial?.label ?? '',
      full_name: initial?.full_name ?? '',
      phone: initial?.phone ?? '',
      address_line1: initial?.address_line1 ?? '',
      address_line2: initial?.address_line2 ?? '',
      city: initial?.city ?? '',
      state: initial?.state,
      pincode: initial?.pincode ?? '',
      delivery_notes: initial?.delivery_notes ?? '',
      is_default: initial?.is_default ?? false,
    },
  })

  const onSubmit = async (values: AddressFormValues) => {
    setSaving(true)
    setServerError(null)
    try {
      await onSave(values)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Label (e.g. Home)" error={errors.label?.message}>
          <input {...register('label')} type="text" placeholder="Home" style={inputStyle} />
        </Field>
        <Field label="Full Name" error={errors.full_name?.message}>
          <input {...register('full_name')} type="text" autoComplete="name" style={errors.full_name ? inputErrorStyle : inputStyle} />
        </Field>
      </div>

      <Field label="Mobile Number" error={errors.phone?.message}>
        <input {...register('phone')} type="tel" autoComplete="tel" maxLength={10} style={errors.phone ? inputErrorStyle : inputStyle} />
      </Field>

      <Field label="Address Line 1" error={errors.address_line1?.message}>
        <input {...register('address_line1')} type="text" autoComplete="address-line1" placeholder="House / Flat no., Street" style={errors.address_line1 ? inputErrorStyle : inputStyle} />
      </Field>

      <Field label="Address Line 2 (optional)" error={errors.address_line2?.message}>
        <input {...register('address_line2')} type="text" autoComplete="address-line2" placeholder="Landmark, Area" style={inputStyle} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="City" error={errors.city?.message}>
          <input {...register('city')} type="text" autoComplete="address-level2" style={errors.city ? inputErrorStyle : inputStyle} />
        </Field>
        <Field label="Pincode" error={errors.pincode?.message}>
          <input {...register('pincode')} type="text" inputMode="numeric" maxLength={6} autoComplete="postal-code" style={errors.pincode ? inputErrorStyle : inputStyle} />
        </Field>
      </div>

      <Field label="State" error={errors.state?.message}>
        <select {...register('state')} autoComplete="address-level1" style={errors.state ? inputErrorStyle : inputStyle}>
          <option value="">Select state / UT</option>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      <Field label="Delivery Notes (optional)" error={errors.delivery_notes?.message}>
        <input {...register('delivery_notes')} type="text" placeholder="Landmark, gate code, building name…" style={inputStyle} />
      </Field>

      {showDefaultToggle && (
        <label className="flex items-center gap-2.5 cursor-pointer" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)' }}>
          <input {...register('is_default')} type="checkbox" style={{ accentColor: 'var(--color-green)', width: 15, height: 15 }} />
          Set as default address
        </label>
      )}

      {serverError && (
        <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-rose)' }}>{serverError}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase',
            backgroundColor: 'var(--color-green)', color: 'var(--color-white)',
            border: 'none', borderRadius: 'var(--radius-btn)', padding: '12px 24px',
            cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase',
            backgroundColor: 'transparent', color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-btn)', padding: '12px 24px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
