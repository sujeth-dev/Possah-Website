// @ts-check
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Cache optimised images at Vercel edge for 1 year.
    // Without this the default is 60 s — Vercel re-fetches from Supabase on
    // every cache expiry, defeating the CDN entirely.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        // Admin / preview images from Vercel deployments
        protocol: 'https',
        hostname: '**.vercel.app',
      },
    ],
    // Serve AVIF first (smallest), fall back to WebP — both auto-converted
    // by Vercel's image optimisation layer; original files on Supabase are
    // never modified.
    formats: ['image/avif', 'image/webp'],
  },
  webpack: (config) => {
    config.infrastructureLogging = { level: 'error' }
    return config
  },
  experimental: {
    // FIX-INFRA-04: expanded package imports optimisation
    optimizePackageImports: [
      'swiper',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      'lucide-react',
    ],
  },
  // FIX-SEC-02: security response headers — no CSP yet (Razorpay + GA4 origins
  // need cataloguing first; add in report-only mode after launch).
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
export default withSentryConfig(nextConfig, {
  // Sentry organisation + project — set these as Vercel env vars or .env.local
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for source-map upload (Vercel: SENTRY_AUTH_TOKEN secret)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps to Sentry for readable stack traces in production.
  // Source maps are deleted from the deploy bundle after upload.
  silent: true,
  hideSourceMaps: true,

  // Automatically tree-shake Sentry code when DSN is not set.
  disableLogger: true,
})
