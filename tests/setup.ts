// FIX-TEST-01: Global test setup
// Runs before every test file via vitest.config.ts setupFiles.

import { vi } from 'vitest'

// Stub env vars so lib/env.ts validation passes in test environment.
// Tests that need specific values override them per-test.
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder_anon_key_that_is_long_enough')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'placeholder_service_role_key_long_enough_xxx')
vi.stubEnv('NEXTAUTH_SECRET', 'placeholder_nextauth_secret_must_be_32chars_x')
vi.stubEnv('NEXTAUTH_URL', 'https://localhost:3000')
vi.stubEnv('GOOGLE_CLIENT_ID', 'placeholder_google_client_id')
vi.stubEnv('GOOGLE_CLIENT_SECRET', 'placeholder_google_client_secret')
vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
vi.stubEnv('RAZORPAY_KEY_SECRET', 'placeholder_razorpay_secret')
vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'placeholder_webhook_secret')
vi.stubEnv('RESEND_API_KEY', 're_placeholder_resend_key')
