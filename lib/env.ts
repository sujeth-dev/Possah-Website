/**
 * FIX-SEC-08: Environment variable validation at startup.
 *
 * Import this file at the top of any module that uses env vars to trigger
 * validation at module load time. A missing or malformed variable throws
 * immediately — surfaces misconfigured deployments before the first request.
 *
 * Usage: add `import '@/lib/env'` to lib/razorpay.ts, lib/email.ts,
 *        lib/auth.ts, lib/supabase/admin.ts
 */

import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or too short'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY is missing or too short'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 chars'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  GOOGLE_CLIENT_ID: z.string().min(10, 'GOOGLE_CLIENT_ID is missing'),
  GOOGLE_CLIENT_SECRET: z.string().min(10, 'GOOGLE_CLIENT_SECRET is missing'),
  RAZORPAY_KEY_ID: z.string().startsWith('rzp_', 'RAZORPAY_KEY_ID must start with rzp_'),
  RAZORPAY_KEY_SECRET: z.string().min(10, 'RAZORPAY_KEY_SECRET is missing'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(10, 'RAZORPAY_WEBHOOK_SECRET is missing'),
  RESEND_API_KEY: z.string().startsWith('re_', 'RESEND_API_KEY must start with re_'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(
    `[env] Missing or invalid environment variables:\n${issues}\n\n` +
    `Check your .env.local against .env.local.example`
  )
}

export const env = parsed.data
