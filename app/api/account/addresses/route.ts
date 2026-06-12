import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, DEV_SESSION } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const

const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  full_name: z.string().trim().min(2).max(100).regex(/[a-zA-Z]/, 'Enter a valid name'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  address_line1: z.string().trim().min(5).max(200),
  address_line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80).regex(/^[a-zA-Z\s\-.]+$/, 'Enter a valid city'),
  state: z.enum(INDIAN_STATES, { errorMap: () => ({ message: 'Select your state' }) }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter valid 6-digit pincode'),
  delivery_notes: z.string().trim().max(300).optional(),
  is_default: z.boolean().optional(),
})

async function getOrCreateUserId(email: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  if (data) return data.id
  const { data: created } = await supabase
    .from('users')
    .insert({ email })
    .select('id')
    .single()
  return created?.id ?? null
}

// GET /api/account/addresses
export async function GET() {
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev ? DEV_SESSION : await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getOrCreateUserId(session.user.email!)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('user_addresses')
    .select('id, label, full_name, phone, address_line1, address_line2, city, state, pincode, delivery_notes, is_default, created_at')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ addresses: data ?? [] })
}

// POST /api/account/addresses
export async function POST(req: Request) {
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev ? DEV_SESSION : await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = addressSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.flatten() }, { status: 400 })
  }

  const userId = await getOrCreateUserId(session.user.email!)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const supabase = createAdminClient()

  // Count existing addresses to determine if this is the first one
  const { count } = await supabase
    .from('user_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const isFirst = (count ?? 0) === 0
  const makeDefault = parsed.data.is_default || isFirst

  // If setting as default, unset all existing defaults first
  if (makeDefault) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
  }

  const { data, error } = await supabase
    .from('user_addresses')
    .insert({
      user_id: userId,
      label: parsed.data.label ?? null,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      address_line1: parsed.data.address_line1,
      address_line2: parsed.data.address_line2 ?? null,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      delivery_notes: parsed.data.delivery_notes ?? null,
      is_default: makeDefault,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ address: data }, { status: 201 })
}
