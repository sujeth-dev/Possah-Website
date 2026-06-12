import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmailPreviewForm } from './EmailPreviewForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Email Preview — Admin' }

interface OrderOption {
  id:           string
  order_number: string
  customer_name: string
}

async function getRecentOrders(): Promise<OrderOption[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, customer_name')
      .order('created_at', { ascending: false })
      .limit(20)
    return (data as OrderOption[]) ?? []
  } catch {
    return []
  }
}

export default async function EmailPreviewPage() {
  const orders = await getRecentOrders()

  return (
    <div className="p-6 md:p-8" style={{ maxWidth: '640px' }}>
      <h1
        style={{
          fontFamily:    'var(--font-body)',
          fontSize:      '22px',
          fontWeight:    '600',
          color:         'var(--color-text)',
          marginBottom:  '6px',
        }}
      >
        Email Preview
      </h1>
      <p
        style={{
          fontFamily:   'var(--font-body)',
          fontSize:     '13px',
          color:        'var(--color-text-muted)',
          marginBottom: '28px',
        }}
      >
        Send a test confirmation email to any address. Tagged <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>test=true</code> in Resend. Does not affect the order record.
      </p>
      <EmailPreviewForm orders={orders} />
    </div>
  )
}
