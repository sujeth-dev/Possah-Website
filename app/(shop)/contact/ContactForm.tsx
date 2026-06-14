'use client'

import { useState, useId, cloneElement, isValidElement } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  email: z.string().email('Invalid email'),
  subject: z.string().min(1, 'Subject required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

type ContactFields = z.infer<typeof contactSchema>

const SUBJECTS = [
  'Order enquiry',
  'Made-to-Measure',
  'Bridal & trousseau',
  'Wholesale / stockist',
  'Returns & exchanges',
  'Other',
]

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '16px',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-btn)',
  padding: '12px 14px',
  width: '100%',
  outline: 'none',
}

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  border: '1px solid var(--color-rose)',
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: error ? 'var(--color-rose)' : 'var(--color-text-muted)',
        }}
      >
        {label}
      </label>
      {isValidElement(children)
        ? cloneElement(children as React.ReactElement<{ id?: string }>, { id })
        : children}
      {error && (
        <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-rose)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFields>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFields) => {
    setState('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('failed')
      setState('success')
      reset()
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-start gap-4">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full"
          style={{ backgroundColor: 'rgba(31,58,45,0.08)', border: '1.5px solid var(--color-green)' }}
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round">
            <path d="M1 7l6 6L19 1" />
          </svg>
        </div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: '400',
            color: 'var(--color-text)',
          }}
        >
          Message sent.
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          We&rsquo;ll be in touch within 24 hours. If it&rsquo;s urgent, WhatsApp is always faster.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" error={errors.name?.message}>
          <input
            {...register('name')}
            type="text"
            autoComplete="name"
            style={errors.name ? inputErrorStyle : inputStyle}
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            style={errors.email ? inputErrorStyle : inputStyle}
            aria-invalid={!!errors.email}
          />
        </Field>
      </div>

      <Field label="Subject" error={errors.subject?.message}>
        <select
          {...register('subject')}
          style={errors.subject ? inputErrorStyle : inputStyle}
          aria-invalid={!!errors.subject}
        >
          <option value="">Select a subject</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <Field label="Message" error={errors.message?.message}>
        <textarea
          {...register('message')}
          rows={5}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
          aria-invalid={!!errors.message}
        />
      </Field>

      {state === 'error' && (
        <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-rose)' }}>
          Something went wrong. Please try again or email us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="self-start flex items-center gap-2 px-10 py-3.5 transition-opacity duration-200 hover:opacity-80 disabled:opacity-50"
        style={{
          backgroundColor: 'var(--color-green)',
          color: 'var(--color-white)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          borderRadius: 'var(--radius-btn)',
          border: 'none',
          cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
        }}
        aria-busy={state === 'submitting'}
      >
        {state === 'submitting' ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : 'Send Message'}
      </button>
    </form>
  )
}
