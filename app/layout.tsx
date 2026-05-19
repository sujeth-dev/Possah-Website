import type { Metadata } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import '@/styles/globals.css'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// ─── Google Fonts (closest available matches for brand fonts) ──
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: {
    template: '%s — The Possah',
    default: 'The Possah — Luxury Indian Fashion | she wants what she wants.',
  },
  description:
    'The Possah is a luxury Indian fashion atelier. Handcrafted sarees, lehengas, and co-ord sets — made to fit you. Not for trends. For you.',
  metadataBase: new URL('https://thepossah.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://thepossah.com',
    siteName: 'The Possah',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'The Possah — Luxury Indian Fashion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@thepossah',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AnnouncementBar />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
