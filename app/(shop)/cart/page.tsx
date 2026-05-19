import type { Metadata } from 'next'
import { CartView } from './CartView'

export const metadata: Metadata = {
  title: 'Your Bag — The Possah',
  description: 'Review your selected pieces before checkout.',
  robots: { index: false, follow: false },
}

export default function CartPage() {
  return <CartView />
}
