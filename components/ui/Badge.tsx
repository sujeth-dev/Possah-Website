import { cn } from '@/lib/utils'

type BadgeVariant = 'new' | 'sale' | 'low-stock' | 'delivered' | 'processing' | 'shipped' | 'cancelled' | 'pending' | 'paid' | 'failed'

interface BadgeProps {
  variant: BadgeVariant
  className?: string
  children?: React.ReactNode
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string; label: string }> = {
  new:        { bg: 'var(--color-orange)',  color: 'var(--color-white)', label: 'NEW'        },
  sale:       { bg: 'var(--color-orange)',  color: 'var(--color-white)', label: 'SALE'       },
  'low-stock':{ bg: '#C8973A',              color: 'var(--color-white)', label: 'LOW STOCK'  },
  delivered:  { bg: 'var(--color-success)', color: 'var(--color-white)', label: 'DELIVERED'  },
  processing: { bg: 'var(--color-green)',   color: 'var(--color-bg)',    label: 'PROCESSING' },
  shipped:    { bg: 'var(--color-green)',   color: 'var(--color-bg)',    label: 'SHIPPED'    },
  cancelled:  { bg: '#C0392B',             color: 'var(--color-white)', label: 'CANCELLED'  },
  pending:    { bg: '#9B9B9B',             color: 'var(--color-white)', label: 'PENDING'    },
  paid:       { bg: 'var(--color-success)', color: 'var(--color-white)', label: 'PAID'       },
  failed:     { bg: '#C0392B',             color: 'var(--color-white)', label: 'FAILED'     },
}

export function Badge({ variant, className, children }: BadgeProps) {
  const { bg, color, label } = BADGE_STYLES[variant]

  return (
    <span
      className={cn('inline-flex items-center px-1.5 py-0.5', className)}
      style={{
        backgroundColor: bg,
        color,
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        letterSpacing: '0.18em',
        borderRadius: '1px',
        lineHeight: 1.4,
        textTransform: 'uppercase',
      }}
    >
      {children ?? label}
    </span>
  )
}
