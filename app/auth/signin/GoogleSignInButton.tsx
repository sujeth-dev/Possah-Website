'use client'

import { signIn } from 'next-auth/react'

interface Props {
  callbackUrl: string
}

export default function GoogleSignInButton({ callbackUrl }: Props) {
  return (
    <button
      onClick={() => signIn('google', { callbackUrl })}
      className="inline-flex items-center justify-center px-10 py-3.5 transition-opacity duration-200 hover:opacity-80"
      style={{
        backgroundColor: 'var(--color-green)',
        color: 'var(--color-white)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        borderRadius: 'var(--radius-btn)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      Continue with Google
    </button>
  )
}
