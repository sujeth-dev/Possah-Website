import { type ButtonHTMLAttributes, forwardRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  loading?: boolean
  fullWidth?: boolean
}

const sizeClasses = {
  sm: 'px-5 py-2.5 text-[11px]',
  md: 'px-8 py-3.5 text-[12px]',
  lg: 'px-10 py-4 text-[13px]',
}

const variantStyles = {
  primary: {
    backgroundColor: 'var(--color-green)',
    color: 'var(--color-bg)',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--color-green)',
    border: '1.5px solid var(--color-green)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-green)',
    border: 'none',
  },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      href,
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const baseClass = cn(
      'inline-flex items-center justify-center gap-2',
      'font-[var(--font-body)] font-medium tracking-[0.1em] uppercase',
      'transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-green)] focus-visible:ring-offset-2',
      'select-none',
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      variant === 'ghost' ? 'underline-offset-4 hover:underline' : 'hover:opacity-88',
      disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      className
    )

    const combinedStyle = {
      borderRadius: 'var(--radius-btn)',
      ...variantStyles[variant],
      ...style,
    }

    if (href) {
      return (
        <Link href={href} className={baseClass} style={combinedStyle} aria-disabled={disabled}>
          {loading ? <Spinner /> : children}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        className={baseClass}
        style={combinedStyle}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? <Spinner /> : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
