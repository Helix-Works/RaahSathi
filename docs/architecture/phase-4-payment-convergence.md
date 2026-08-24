# Phase 4 payment convergence

Phase 4 adds synthetic fee payment without trusting browser amounts, redirects, or success claims. All money values are integer minor units in INR and come from server fee rules.

## Flow

```text
verified application
  -> server creates one immutable FeeSnapshot
  -> POST /api/v1/applications/:id/payments creates/resumes an idempotent attempt
  -> simulated provider emits a signed event
  -> POST /api/v1/payment-provider/events authenticates the HMAC
  -> transaction deduplicates providerEventId
  -> PaymentAttempt + Application + ApplicationEvent converge together
  -> application becomes READY_FOR_APPOINTMENT exactly once
```

`SUCCESS`, `DELAYED_SUCCESS`, `DUPLICATE_CALLBACK`, `FAILED`, and `PROVIDER_UNAVAILABLE` are persisted synthetic scenarios. No real payment network or financial data is used.

## Guarantees

- The create request contains only an idempotency key; client-selected amounts and statuses are rejected by strict Zod validation.
- `FeeSnapshot` is unique per application and protected by database amount/currency checks.
- Provider events use a stable event ID, HMAC-SHA-256 authentication, and an amount match against the snapshot.
- Duplicate and reordered events are retained safely but cannot duplicate workflow advancement.
- A delayed signed success converges without a browser session or redirect.
- Payment reads are applicant-owner scoped; the callback learns no applicant secrets.
- Provider references and all data are synthetic.

## Configuration and testing

`PAYMENT_PROVIDER_WEBHOOK_SECRET` is server-only, at least 32 characters, and must not be a placeholder in production. Database race tests require an explicitly approved disposable `TEST_DATABASE_URL`; no production migration or reset is part of Phase 4 development.
