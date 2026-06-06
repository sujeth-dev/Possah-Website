import type { UseFormRegister } from 'react-hook-form'
import type { CheckoutFields } from './checkoutTypes'
import { DELIVERY_OPTIONS } from './checkoutTypes'
import { formatPrice } from '@/lib/utils'

interface Props {
  register: UseFormRegister<CheckoutFields>
  deliveryOption: 'standard' | 'express'
  freeShipping: boolean
}

export function CheckoutDeliveryOptions({ register, deliveryOption, freeShipping }: Props) {
  return (
    <section aria-labelledby="delivery-heading">
      <h2
        id="delivery-heading"
        className="mb-4"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
        }}
      >
        Delivery
      </h2>
      <div className="flex flex-col gap-3">
        {DELIVERY_OPTIONS.map((opt) => {
          const selected = deliveryOption === opt.value
          const cost = freeShipping ? 0 : opt.price
          return (
            <label
              key={opt.value}
              className="flex items-center justify-between gap-4 cursor-pointer px-4 py-3.5 transition-all duration-150"
              style={{
                border: `1.5px solid ${selected ? 'var(--color-green)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-card)',
                backgroundColor: selected ? 'rgba(31,58,45,0.04)' : 'transparent',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `1.5px solid ${selected ? 'var(--color-green)' : 'var(--color-border)'}`,
                    backgroundColor: selected ? 'var(--color-green)' : 'transparent',
                  }}
                >
                  {selected && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-white)',
                        display: 'block',
                      }}
                    />
                  )}
                </span>
                <input
                  {...register('delivery_option')}
                  type="radio"
                  value={opt.value}
                  className="sr-only"
                />
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'var(--color-text)',
                    }}
                  >
                    {opt.label}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {opt.sub}
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  color: freeShipping ? 'var(--color-green)' : 'var(--color-text)',
                }}
              >
                {freeShipping ? 'FREE' : formatPrice(cost)}
              </span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
