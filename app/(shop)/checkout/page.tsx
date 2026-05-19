import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CheckoutForm } from './CheckoutForm'

export const metadata: Metadata = {
  title: 'Checkout — The Possah',
  description: 'Complete your order.',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutForm />
    </Suspense>
  )
}
