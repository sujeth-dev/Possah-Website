import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import '@/styles/globals.css'

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    template: '%s - The Possah',
    default: 'The Possah - Luxury Indian Fashion | she wants what she wants.',
  },
  description: 'The Possah is a luxury Indian fashion atelier. Handcrafted sarees, lehengas, and co-ord sets - made to fit you. Not for trends. For you.',
  metadataBase: new URL('https://thepossah.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://thepossah.com',
    siteName: 'The Possah',
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: 'The Possah - Luxury Indian Fashion' }],
  },
  twitter: { card: 'summary_large_image', site: '@thepossah' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
      <body>
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{page_path:window.location.pathname});`}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  )
}
