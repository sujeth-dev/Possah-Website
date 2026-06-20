import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AddedToBagToast } from '@/components/ui/AddedToBagToast'
import { PageTransitionWrapper } from '@/components/layout/PageTransitionWrapper'

/**
 * Shop layout — wraps all public-facing routes under app/(shop)/.
 * Separated from the root layout so admin routes don't inherit the
 * shop header, footer, and announcement bar.
 *
 * PageTransitionWrapper wraps only the page content (not Header/Footer)
 * so the nav bar stays static during route transitions.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main id="main-content">
        <PageTransitionWrapper>{children}</PageTransitionWrapper>
      </main>
      <Footer />
      <AddedToBagToast />
    </>
  )
}
