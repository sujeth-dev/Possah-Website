import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

/**
 * Shop layout — wraps all public-facing routes under app/(shop)/.
 * Separated from the root layout so admin routes don't inherit the
 * shop header, footer, and announcement bar.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  )
}
