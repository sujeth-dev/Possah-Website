# k6 Load Test — Possah API

## Prerequisites

Install k6 (one-time):
```bash
# macOS
brew install k6

# Windows (winget)
winget install k6

# Or download from https://k6.io/docs/get-started/installation/
```

## Run against staging

```bash
# Basic run — uses invalid Razorpay signatures (tests rejection path)
k6 run -e BASE_URL=https://your-preview.vercel.app scripts/load_test/k6.js

# With summary output to file
k6 run -e BASE_URL=https://your-preview.vercel.app --out json=results.json scripts/load_test/k6.js
```

## Scenarios

| Scenario | VUs | Duration | What it tests |
|----------|-----|----------|---------------|
| order_creation | 0→10 | 3 min | orders/create request handling, Zod validation, DB round-trip |
| webhook_load   | 0→10 | 3 min | webhook HMAC rejection, response time |

## Thresholds (auto-fail if breached)

| Metric | Threshold |
|--------|-----------|
| http_req_duration p95 | < 3 000 ms |
| http_req_failed | < 1% |
| order_create_success_rate | > 50% (fake UUIDs cause 400s by design) |
| webhook_duration_ms p95 | < 500 ms |

## Notes

- `order_create` uses fake UUIDs that won't match any DB row → always 400. That is expected. The test proves the endpoint doesn't 5xx under load.
- Webhook always sends an invalid signature → always 400. The test proves HMAC rejection is fast (< 500 ms p95).
- NEVER run against production with live Razorpay keys. Use a Vercel preview branch.
