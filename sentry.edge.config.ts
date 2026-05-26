// Sentry Edge runtime initialisation.
// Loaded for Middleware and any Route Handlers opting into the Edge runtime.
// The Edge runtime is a subset of Node — only Web APIs are available.

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
  })
}
