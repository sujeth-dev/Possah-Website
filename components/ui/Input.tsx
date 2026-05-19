import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: error ? 'var(--color-error)' : 'var(--color-text)',
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 h-12 appearance-none bg-white',
            'text-[15px] placeholder:text-[var(--color-text-muted)]',
            'transition-all duration-200',
            'outline-none',
            error ? '' : '',
            className
          )}
          style={{
            border: error
              ? '1px solid var(--color-error)'
              : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-body)',
            fontSize: '16px', // ≥ 16px prevents iOS zoom on focus
            ...style,
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-green)'
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? 'var(--color-error)'
              : 'var(--color-border)'
            props.onBlur?.(e)
          }}
          {...props}
        />
        {error && (
          <span
            id={`${inputId}-error`}
            role="alert"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: 'var(--color-error)',
            }}
          >
            {error}
          </span>
        )}
        {!error && hint && (
          <span
            id={`${inputId}-hint`}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: 'var(--color-text-muted)',
            }}
          >
            {hint}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: error ? 'var(--color-error)' : 'var(--color-text)',
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn('w-full px-3.5 py-3 bg-white appearance-none resize-y min-h-[120px]', className)}
          style={{
            border: error ? '1px solid var(--color-error)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            ...style,
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-green)'
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-error)' : 'var(--color-border)'
            props.onBlur?.(e)
          }}
          {...props}
        />
        {error && (
          <span
            id={`${inputId}-error`}
            role="alert"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--color-error)' }}
          >
            {error}
          </span>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// ─── Select ────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: error ? 'var(--color-error)' : 'var(--color-text)',
            }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn('w-full px-3.5 h-12 bg-white appearance-none cursor-pointer', className)}
          style={{
            border: error ? '1px solid var(--color-error)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B6B6B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            paddingRight: '36px',
            ...style,
          }}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span
            role="alert"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--color-error)' }}
          >
            {error}
          </span>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
