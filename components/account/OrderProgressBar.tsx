import type { CSSProperties } from 'react'

// =============================================================================
// OrderProgressBar — server component
//
// Renders the 5-step lifecycle of an order.
//   Placed → Confirmed → Processing → Shipped → Delivered
//
// Variants
//   • size="mini" — 5 dots in a row, no labels. Used inside each card on the
//                   orders list. Fits the existing row height.
//   • size="full" — 5 labelled circles connected by line segments. Used on the
//                   order detail page header.
//
// Special states
//   • Cancelled    → red banner replaces the steps entirely. No progress meaning.
//   • Refunded     → grey muted banner.
//   • Failed       → orange banner. The retry CTA elsewhere drives recovery.
//
// Mapping rule (paymentStatus + fulfillmentStatus → currentStep):
//   • payment_status === 'paid' AND fulfillment_status === 'delivered'   → 5
//   • payment_status === 'paid' AND fulfillment_status === 'shipped'     → 4
//   • payment_status === 'paid' AND fulfillment_status === 'processing'  → 3
//   • payment_status === 'paid' AND fulfillment_status === 'unfulfilled' → 2  (paid, not yet picked)
//   • payment_status === 'pending'                                       → 1  (placed, awaiting payment)
//   • payment_status === 'failed'                                        → 1 + failed banner above
//
// Cancelled has its own branch.
// =============================================================================

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type FulfillmentStatus =
  | 'unfulfilled'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

interface OrderProgressBarProps {
  paymentStatus: PaymentStatus | string
  fulfillmentStatus: FulfillmentStatus | string
  size?: 'mini' | 'full'
  placedAt?: string
}

const STEPS = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'] as const

function currentStep(
  payment: string,
  fulfillment: string,
): { step: 0 | 1 | 2 | 3 | 4 | 5; failed: boolean } {
  if (payment === 'pending')  return { step: 1, failed: false }
  if (payment === 'failed')   return { step: 1, failed: true }
  // payment === 'paid' from here on
  switch (fulfillment) {
    case 'delivered':   return { step: 5, failed: false }
    case 'shipped':     return { step: 4, failed: false }
    case 'processing':  return { step: 3, failed: false }
    case 'unfulfilled': return { step: 2, failed: false }
    default:            return { step: 2, failed: false }
  }
}

function StateBanner({
  label,
  colour,
  bg,
}: {
  label: string
  colour: string
  bg: string
}) {
  return (
    <div
      role="status"
      style={{
        backgroundColor: bg,
        color: colour,
        padding: '8px 12px',
        borderRadius: 'var(--radius-card)',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colour }}
      />
      {label}
    </div>
  )
}

export function OrderProgressBar({
  paymentStatus,
  fulfillmentStatus,
  size = 'mini',
  placedAt,
}: OrderProgressBarProps) {
  // Special terminal states — replace the step bar entirely
  if (fulfillmentStatus === 'cancelled') {
    return <StateBanner label="Cancelled" colour="#9B3A3A" bg="rgba(192, 57, 43, 0.08)" />
  }
  if (paymentStatus === 'refunded') {
    return <StateBanner label="Refunded" colour="#6B6B6B" bg="rgba(107, 107, 107, 0.08)" />
  }

  const { step, failed } = currentStep(paymentStatus, fulfillmentStatus)

  if (size === 'mini') return <MiniBar step={step} failed={failed} />
  return <FullBar step={step} failed={failed} placedAt={placedAt} />
}

// ── Mini variant ────────────────────────────────────────────────────────────

function MiniBar({ step, failed }: { step: number; failed: boolean }) {
  const wrapper: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }
  return (
    <div
      role="img"
      aria-label={`Order progress: step ${step} of 5${failed ? ' (payment failed)' : ''}`}
      style={wrapper}
    >
      {STEPS.map((_, i) => {
        const reached = i + 1 <= step
        const dotColour = failed && i === 0
          ? 'var(--color-orange)'
          : reached
          ? 'var(--color-green)'
          : 'var(--color-border)'
        return (
          <span
            key={i}
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: dotColour,
              display: 'inline-block',
            }}
          />
        )
      })}
      {failed && (
        <span
          style={{
            marginLeft: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-orange)',
          }}
        >
          Payment failed
        </span>
      )}
    </div>
  )
}

// ── Full variant ────────────────────────────────────────────────────────────

const CIRCLE_SIZE = 28

const STATUS_DESC: Record<number, string> = {
  1: 'Order received — awaiting payment confirmation.',
  2: 'Payment confirmed — your order is being prepared.',
  3: 'Your order is being processed and packed.',
  4: 'Your order has been shipped and is on its way.',
  5: 'Your order has been delivered. Thank you!',
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  } catch { return '' }
}

// Mobile: vertical step list (circle left, label+desc right)
function MobileFullBar({ step, failed, placedAt }: { step: number; failed: boolean; placedAt?: string }) {
  return (
    <div>
      {STEPS.map((label, i) => {
        const stepNumber    = i + 1
        const reached       = stepNumber <= step
        const active        = stepNumber === step
        const isLast        = i === STEPS.length - 1
        const isFailedFirst = failed && i === 0

        const circleBg     = isFailedFirst ? 'var(--color-orange)' : reached ? 'var(--color-green)' : 'var(--color-bg)'
        const circleBorder = isFailedFirst ? 'var(--color-orange)' : reached ? 'var(--color-green)' : 'var(--color-border)'
        const circleFg     = reached ? 'var(--color-bg)' : 'var(--color-text-muted)'
        const lineColor    = isFailedFirst ? 'var(--color-orange)' : reached ? 'var(--color-green)' : 'var(--color-border)'

        return (
          <div key={label} style={{ display: 'flex', gap: 14 }}>
            {/* Left: circle + vertical connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div
                aria-hidden="true"
                style={{
                  width:           CIRCLE_SIZE,
                  height:          CIRCLE_SIZE,
                  borderRadius:    '50%',
                  backgroundColor: circleBg,
                  border:          `1.5px solid ${circleBorder}`,
                  color:           circleFg,
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  fontFamily:      'var(--font-mono)',
                  fontSize:        '11px',
                  letterSpacing:   '0.04em',
                  flexShrink:      0,
                  boxShadow:       active ? '0 0 0 3px rgba(31,58,45,0.15)' : undefined,
                  opacity:         reached && !active ? 0.72 : 1,
                }}
              >
                {reached ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 6.5l2.5 2.5L10 3.5" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              {!isLast && (
                <div
                  aria-hidden="true"
                  style={{
                    flex:            1,
                    width:           1.5,
                    minHeight:       20,
                    backgroundColor: lineColor,
                    opacity:         reached && !active ? 0.72 : 1,
                  }}
                />
              )}
            </div>

            {/* Right: label + optional date + optional status desc */}
            <div style={{ flex: 1, paddingTop: 4, paddingBottom: isLast ? 0 : 16, minWidth: 0 }}>
              <p style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      active ? '11px' : '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color:         active ? 'var(--color-green)' : 'var(--color-text-muted)',
                fontWeight:    active ? 600 : 400,
                opacity:       reached && !active ? 0.8 : 1,
                margin:        0,
              }}>
                {label}
              </p>
              {i === 0 && placedAt && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize:   '11px',
                  color:      'var(--color-text-muted)',
                  margin:     '2px 0 0',
                }}>
                  {formatShortDate(placedAt)}
                </p>
              )}
              {active && !failed && STATUS_DESC[step] && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize:   '12px',
                  color:      'var(--color-text-muted)',
                  margin:     '3px 0 0',
                  lineHeight: 1.4,
                }}>
                  {STATUS_DESC[step]}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Desktop: horizontal bar with circles + connecting line
function DesktopFullBar({ step, failed, placedAt }: { step: number; failed: boolean; placedAt?: string }) {
  return (
    <>
      {/* Wrapper — position:relative so the connector bar can be absolute */}
      <div style={{ position: 'relative' }}>

        {/* Connecting bar — absolutely positioned at vertical centre of circles */}
        <div
          aria-hidden="true"
          style={{
            position:        'absolute',
            top:             CIRCLE_SIZE / 2,
            left:            CIRCLE_SIZE / 2,
            right:           CIRCLE_SIZE / 2,
            height:          1.5,
            backgroundColor: 'var(--color-border)',
            zIndex:          0,
          }}
        >
          <div
            style={{
              width:           `${Math.max(0, (step - 1) / 4) * 100}%`,
              height:          '100%',
              backgroundColor: failed ? 'var(--color-orange)' : 'var(--color-green)',
              transition:      'width 0.25s ease',
            }}
          />
        </div>

        {/* Steps row — z-index 1 so circles sit above the bar */}
        <div className="relative flex items-start justify-between" style={{ zIndex: 1 }}>
          {STEPS.map((label, i) => {
            const stepNumber    = i + 1
            const reached       = stepNumber <= step
            const active        = stepNumber === step
            const isFailedFirst = failed && i === 0
            const isPlaced      = i === 0

            const circleBg     = isFailedFirst ? 'var(--color-orange)' : reached ? 'var(--color-green)' : 'var(--color-bg)'
            const circleBorder = isFailedFirst ? 'var(--color-orange)' : reached ? 'var(--color-green)' : 'var(--color-border)'
            const circleFg     = reached ? 'var(--color-bg)' : 'var(--color-text-muted)'

            return (
              <div
                key={label}
                className="flex flex-col items-center text-center"
                style={{ flex: '1 1 0', minWidth: 0 }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width:           CIRCLE_SIZE,
                    height:          CIRCLE_SIZE,
                    borderRadius:    '50%',
                    backgroundColor: circleBg,
                    border:          `1.5px solid ${circleBorder}`,
                    color:           circleFg,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    fontFamily:      'var(--font-mono)',
                    fontSize:        '11px',
                    letterSpacing:   '0.04em',
                    flexShrink:      0,
                    boxShadow:       active ? '0 0 0 3px rgba(31,58,45,0.15)' : undefined,
                    opacity:         reached && !active ? 0.72 : 1,
                  }}
                >
                  {reached ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 6.5l2.5 2.5L10 3.5" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>

                <span
                  style={{
                    marginTop:     6,
                    fontFamily:    'var(--font-mono)',
                    fontSize:      active ? '10px' : '8px',
                    letterSpacing: active ? '0.16em' : '0.10em',
                    textTransform: 'uppercase',
                    color:         active ? 'var(--color-green)' : 'var(--color-text-muted)',
                    fontWeight:    active ? 600 : 400,
                    lineHeight:    1.3,
                    overflow:      'hidden',
                    textOverflow:  'ellipsis',
                    whiteSpace:    'nowrap',
                    maxWidth:      '100%',
                  }}
                >
                  {label}
                </span>

                {isPlaced && placedAt && (
                  <span
                    style={{
                      marginTop:     2,
                      fontFamily:    'var(--font-body)',
                      fontSize:      '9px',
                      color:         'var(--color-text-muted)',
                      lineHeight:    1.2,
                      overflow:      'hidden',
                      textOverflow:  'ellipsis',
                      whiteSpace:    'nowrap',
                      maxWidth:      '100%',
                      opacity:       0.7,
                    }}
                  >
                    {formatShortDate(placedAt)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {!failed && STATUS_DESC[step] && (
        <p
          style={{
            marginTop:  14,
            fontFamily: 'var(--font-body)',
            fontSize:   '13px',
            color:      'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          {STATUS_DESC[step]}
        </p>
      )}
    </>
  )
}

function FullBar({ step, failed, placedAt }: { step: number; failed: boolean; placedAt?: string }) {
  const failedMsg = failed ? (
    <p
      role="alert"
      style={{
        marginTop:  14,
        fontFamily: 'var(--font-body)',
        fontSize:   '13px',
        color:      'var(--color-orange)',
        lineHeight: 1.5,
      }}
    >
      Payment failed. Retry from the order list below.
    </p>
  ) : null

  return (
    <div
      role="img"
      aria-label={`Order progress: step ${step} of 5${failed ? ' (payment failed)' : ''}`}
      style={{ width: '100%' }}
    >
      {/* Mobile (< md): vertical step list */}
      <div className="md:hidden">
        <MobileFullBar step={step} failed={failed} placedAt={placedAt} />
        {failedMsg}
      </div>

      {/* Desktop (md+): horizontal bar */}
      <div className="hidden md:block">
        <DesktopFullBar step={step} failed={failed} placedAt={placedAt} />
        {failedMsg}
      </div>
    </div>
  )
}
