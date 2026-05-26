// Sentry browser-side initialisation.
// This file is loaded automatically by @sentry/nextjs when the browser bundle is built.
// Keep this file lean — it runs in every user's browser.

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,

    // 10% of transactions sampled for performance in production.
    // Set to 1.0 locally for full visibility during development.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture 100% of replays for sessions that hit an error;
    // 0% of generic session replays (keeps Session Replay quota low).
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,

    // Sentry replay is lazy-loaded only when an error occurs — zero KB on happy path.
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Do not send errors from localhost
    enabled: process.env.NODE_ENV === 'production',

    // Filter noisy browser extension errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
  })
}
