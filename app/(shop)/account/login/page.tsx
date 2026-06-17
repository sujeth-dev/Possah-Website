import { redirect } from 'next/navigation'

interface Props {
  searchParams: { callbackUrl?: string }
}

export default function AccountLoginPage({ searchParams }: Props) {
  const dest = searchParams.callbackUrl
    ? `/auth/signin?callbackUrl=${encodeURIComponent(searchParams.callbackUrl)}`
    : '/auth/signin'
  redirect(dest)
}
