// Sentry server-side (Node.js runtime) initialisation.
// Loaded automatically by @sentry/nextjs for Route Handlers, Server Components,
// and middleware running on the Node.js runtime.

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,

    // Capture every server-side transaction during development; 10% in production.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Log Sentry events to the console in development — useful during local testing.
    debug: process.env.NODE_ENV === 'development',
  })
}
