# Environment Variables Setup

This project uses `.env.local` for local development configuration.

## 1. Copy the example

Create a local env file from the example:

```bash
cp .env.local.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

## 2. Fill in your values

Open `.env.local` and replace placeholders with your own values:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
- `NEXTAUTH_SECRET` — strong random string for NextAuth sessions
- `NEXTAUTH_URL` — usually `http://localhost:3000`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `RAZORPAY_KEY_ID` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` — Razorpay public key
- `RAZORPAY_KEY_SECRET` — Razorpay secret key (server-only)
- `RAZORPAY_WEBHOOK_SECRET` — secret used to verify Razorpay webhooks
- `RESEND_API_KEY` — Resend email API key
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — optional GA4 ID
- `ADMIN_EMAIL` — order notification email
- `CF_ACCOUNT_ID` — Cloudflare account ID (R2 image storage; found in dashboard URL)
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — R2 API credentials (server-only)
- `R2_BUCKET_NAME` — R2 bucket name (default: `possah-media`)
- `NEXT_PUBLIC_R2_PUBLIC_URL` — public base URL for served images (either `cdn.thepossah.com` or the bucket's `pub-xxx.r2.dev` URL)

## 3. Why `.env.local`?

- `.env.local` is the local development override file.
- It is gitignored and should never be committed.
- Use `.env.local.example` as the template file.

## 4. Local development workflow

1. Start Supabase locally if needed:

```bash
supabase start
```

2. Copy the values printed by Supabase into `.env.local`.
3. Run the app:

```bash
npm run dev
```

## 5. Production / deployment

- Do not deploy `.env.local` to production.
- Instead, configure environment variables in your hosting provider (Vercel or Cloudflare Pages).
- Use the same variable names as in `.env.local`.

## 6. Important security notes

- `NEXT_PUBLIC_` vars are exposed to the browser. Only put public-safe values there.
- Server-only secrets must not start with `NEXT_PUBLIC_`.
- `NEXTAUTH_SECRET` should be a strong random string, ideally 32+ characters.
- `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `RESEND_API_KEY` are all server-only secrets.

## 7. Troubleshooting

- If the app fails to start, confirm `.env.local` exists in the project root.
- Confirm required vars are not empty.
- Restart the dev server after editing `.env.local`.
