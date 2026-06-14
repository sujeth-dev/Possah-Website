// @ts-check

const isDev = process.env.NODE_ENV !== 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Cache optimised images at Vercel edge for 1 year.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      // R2 CDN — primary image host (custom domain + direct R2 public bucket URL)
      {
        protocol: 'https',
        hostname: 'cdn.thepossah.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      // Legacy: some product images still point to Supabase storage pending full R2 migration
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  webpack: (config) => {
    config.infrastructureLogging = { level: 'error' }
    return config
  },
  experimental: {
    optimizePackageImports: [
      'swiper',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      'lucide-react',
    ],
  },
  async redirects() {
    return [
      { source: '/shop', destination: '/women', permanent: false },
    ]
  },
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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js inlines hydration scripts; dev mode also uses eval() for HMR
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} checkout.razorpay.com cdn.razorpay.com`,
              // Next.js inlines critical CSS
              "style-src 'self' 'unsafe-inline'",
              // Images: self + R2 CDN + Supabase storage + Cloudinary (legacy)
              "img-src 'self' data: blob: cdn.thepossah.com *.r2.dev *.supabase.co res.cloudinary.com",
              "font-src 'self' data:",
              // API calls: Supabase, Razorpay (all subdomains — lumberjack etc.), Google Analytics
              "connect-src 'self' *.supabase.co *.razorpay.com www.google-analytics.com www.googletagmanager.com",
              // Razorpay checkout modal is iframed
              "frame-src checkout.razorpay.com api.razorpay.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
