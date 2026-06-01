import type { Metadata } from 'next'
import { Suspense } from 'react'
import { OrderConfirmationView } from './OrderConfirmationView'

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false, follow: false },
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="container-site py-24 flex items-center justify-center">
        <span
          className="inline-block w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-green)' }}
        />
      </div>
    }>
      <OrderConfirmationView />
    </Suspense>
  )
}
