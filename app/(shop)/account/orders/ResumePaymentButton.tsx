'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orderNumber: string
  customerEmail: string
}

type RzpInstance = {
  open: () => void
  on: (event: string, handler: (resp: Record<string, unknown>) => void) => void
}

export function ResumePaymentButton({ orderNumber, customerEmail }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as Window & typeof globalThis & { Razorpay?: unknown }).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayNow = async () => {
    setLoading(true)
    setError(null)

    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      setError('Payment gateway could not load. Please try again.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/orders/resume-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber }),
      })
      const json = await res.json() as {
        success?: boolean
        message?: string
        razorpay_order_id?: string
        amount?: number
        order_number?: string
        customer_name?: string
        customer_phone?: string
      }

      if (!res.ok || !json.razorpay_order_id) {
        setError(json.message ?? 'Could not initiate payment. Please try again.')
        setLoading(false)
        return
      }

      const RzpCtor = (
        window as Window & typeof globalThis & { Razorpay: new (opts: Record<string, unknown>) => RzpInstance }
      ).Razorpay

      if (!RzpCtor) {
        setError('Razorpay could not load. Please refresh and try again.')
        setLoading(false)
        return
      }

      const rz = new RzpCtor({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: json.razorpay_order_id,
        amount: json.amount,
        currency: 'INR',
        name: 'The Possah',
        description: `Order #${json.order_number}`,
        prefill: {
          name: json.customer_name,
          email: customerEmail,
          contact: json.customer_phone,
        },
        theme: { color: '#1F3A2D' },
        handler: async (response: Record<string, unknown>) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                order_number: json.order_number,
              }),
            })
            const verifyJson = await verifyRes.json() as { success?: boolean }
            if (verifyJson.success) {
              router.push(`/order/confirmation?order=${json.order_number}`)
            } else {
              setError('Payment received but verification failed. Please contact support.')
              setLoading(false)
            }
          } catch {
            setError('Payment received. Please check your orders shortly.')
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled. You can try again anytime.')
            setLoading(false)
          },
        },
      })

      rz.on('payment.failed', (response: Record<string, unknown>) => {
        const err = (response.error ?? {}) as Record<string, string>
        setError(err.description ?? 'Payment failed. Please try a different card or UPI.')
        setLoading(false)
      })

      rz.open()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handlePayNow}
        disabled={loading}
        className="transition-opacity duration-200 hover:opacity-80 disabled:opacity-50"
        style={{
          backgroundColor: 'var(--color-green)',
          color: 'var(--color-white)',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          padding: '8px 16px',
          borderRadius: 'var(--radius-btn)',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? 'Loading…' : 'Pay Now'}
      </button>
      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-error, #dc2626)', maxWidth: '200px', textAlign: 'right' }}>
          {error}
        </p>
      )}
    </div>
  )
}
