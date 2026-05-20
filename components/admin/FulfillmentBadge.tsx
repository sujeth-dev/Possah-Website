type FulfillmentStatus =
  | 'unfulfilled'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

const FULFILLMENT_STYLES: Record<FulfillmentStatus, { bg: string; text: string; label: string }> = {
  unfulfilled: { bg: '#FEF3C7', text: '#92400E', label: 'Unfulfilled' },
  processing:  { bg: '#DBEAFE', text: '#1E40AF', label: 'Processing'  },
  shipped:     { bg: '#E0F2FE', text: '#0369A1', label: 'Shipped'     },
  delivered:   { bg: '#DCFCE7', text: '#166534', label: 'Delivered'   },
  cancelled:   { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled'   },
}

const PAYMENT_STYLES: Record<PaymentStatus, { bg: string; text: string; label: string }> = {
  pending:  { bg: '#FEF3C7', text: '#92400E', label: 'Pending'  },
  paid:     { bg: '#DCFCE7', text: '#166534', label: 'Paid'     },
  failed:   { bg: '#FEE2E2', text: '#991B1B', label: 'Failed'   },
  refunded: { bg: '#F3E8FF', text: '#6B21A8', label: 'Refunded' },
}

export function FulfillmentBadge({ status }: { status: FulfillmentStatus }) {
  const style = FULFILLMENT_STYLES[status] ?? FULFILLMENT_STYLES.unfulfilled
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-sm whitespace-nowrap"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontWeight: '500',
      }}
    >
      {style.label}
    </span>
  )
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const style = PAYMENT_STYLES[status] ?? PAYMENT_STYLES.pending
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-sm whitespace-nowrap"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontWeight: '500',
      }}
    >
      {style.label}
    </span>
  )
}
