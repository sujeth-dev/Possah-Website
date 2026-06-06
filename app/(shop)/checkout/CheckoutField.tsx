import type React from 'react'

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
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
      {children}
      {error && (
        <p
          role="alert"
          style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-rose)' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

export const inputStyle: React.CSSProperties = {
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

export const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  border: '1px solid var(--color-rose)',
}
