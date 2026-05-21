import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import GoogleSignInButton from './GoogleSignInButton'

export const metadata: Metadata = {
  title: 'Sign In - The Possah',
  robots: { index: false, follow: false },
}

interface SignInPageProps {
  searchParams: {
    callbackUrl?: string
  }
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerSession(authOptions)
  const callbackUrl = searchParams.callbackUrl || '/account'

  if (session) {
    redirect(callbackUrl)
  }

  return (
    <div className="container-site py-24">
      <div
        className="mx-auto flex max-w-[520px] flex-col gap-6 rounded-[32px] px-8 py-10"
        style={{
          background: 'linear-gradient(180deg, rgba(31,58,45,0.06) 0%, rgba(244,236,223,0.9) 100%)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex flex-col gap-3">
          <p className="section-label">The Possah Account</p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(30px, 4vw, 48px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              lineHeight: 1.05,
            }}
          >
            Sign in with Google
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.7,
            }}
          >
            Use your Google account to access customer orders and allowlisted admin tools.
          </p>
        </div>

        <GoogleSignInButton callbackUrl={callbackUrl} />

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.7,
          }}
        >
          Admin access is granted only to emails present in `admin_users`.
        </p>
      </div>
    </div>
  )
}
