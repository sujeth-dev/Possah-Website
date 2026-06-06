import { z } from 'zod'

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const

export const checkoutSchema = z.object({
  first_name: z.string().min(1, 'First name required').max(60),
  last_name: z.string().min(1, 'Last name required').max(60),
  email: z.string().email('Invalid email'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  address_line1: z.string().min(5, 'Address required').max(200),
  address_line2: z.string().max(200).optional(),
  city: z.string().min(2, 'City required').max(80),
  state: z.enum(INDIAN_STATES, { errorMap: () => ({ message: 'Select your state' }) }),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  delivery_option: z.enum(['standard', 'express']),
  notes: z.string().max(500).optional(),
})

export type CheckoutFields = z.infer<typeof checkoutSchema>

export const SHIPPING_THRESHOLD = 2500
export const STANDARD_COST = 199
export const EXPRESS_COST = 399
export const GIFT_WRAP_COST = 150

export const DELIVERY_OPTIONS = [
  {
    value: 'standard' as const,
    label: 'Standard Delivery',
    sub: '5–7 business days',
    price: STANDARD_COST,
  },
  {
    value: 'express' as const,
    label: 'Express Delivery',
    sub: '2–3 business days',
    price: EXPRESS_COST,
  },
]
