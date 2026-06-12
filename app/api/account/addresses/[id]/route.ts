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

const patchSchema = z.object({
  label: z.string().trim().max(40).optional(),
  full_name: z.string().trim().min(2).max(100).regex(/[a-zA-Z]/, 'Enter a valid name').optional(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number').optional(),
  address_line1: z.string().trim().min(5).max(200).optional(),
  address_line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80).regex(/^[a-zA-Z\s\-.]+$/, 'Enter a valid city').optional(),
  state: z.enum(INDIAN_STATES, { errorMap: () => ({ message: 'Select your state' }) }).optional(),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter valid 6-digit pincode').optional(),
  delivery_notes: z.string().trim().max(300).optional(),
  is_default: z.boolean().optional(),
})

async function getOrCreateUserId(email: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  if (data) return data.id
  const { data: created } = await supabase.from('users').insert({ email }).select('id').single()
  return created?.id ?? null
}

async function verifyOwnership(addressId: string, userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('user_addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

// PATCH /api/account/addresses/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev ? DEV_SESSION : await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getOrCreateUserId(session.user.email!)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const owned = await verifyOwnership(params.id, userId)
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()

  // If toggling to default, unset others first
  if (parsed.data.is_default === true) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
  }

  const { data, error } = await supabase
    .from('user_addresses')
    .update(parsed.data)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ address: data })
}

// DELETE /api/account/addresses/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev ? DEV_SESSION : await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getOrCreateUserId(session.user.email!)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const supabase = createAdminClient()

  // Check ownership and get is_default status
  const { data: existing } = await supabase
    .from('user_addresses')
    .select('id, is_default')
    .eq('id', params.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase.from('user_addresses').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If deleted address was default, promote the oldest remaining one
  if (existing.is_default) {
    const { data: remaining } = await supabase
      .from('user_addresses')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (remaining?.[0]) {
      await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', remaining[0].id)
    }
  }

  return NextResponse.json({ ok: true })
}
