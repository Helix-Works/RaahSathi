# Phase 3 identity recovery and licence context

Phase 3 adds a synthetic-only identity boundary to durable applications. It does not accept document uploads, contact an external provider, or store real identity data.

## State flow

```text
completed application sections
  -> POST identity-attempts
  -> server derives the seeded provider outcome
  -> PostgreSQL stores synthetic document metadata + IdentityAttempt + application event
  -> recoverable failure leaves application READY_FOR_IDENTITY
  -> POST retry under an application row lock
  -> VERIFIED updates application to READY_FOR_PAYMENT exactly once
```

Provider outcomes are `VERIFIED`, `OTP_INVALID`, `USER_MISMATCH`, `TIMEOUT`, `PROVIDER_UNAVAILABLE`, and `RETRY_REQUIRED`. The browser does not choose the scenario. `USER_MISMATCH` is not automatically retryable; the other failure demonstrations can converge on a safe retry.

## Durability and idempotency

- Identity attempts, retry relationships, synthetic document metadata, and application history are PostgreSQL state.
- Starting an attempt twice returns the existing latest attempt.
- A retry locks the owner-scoped application row and accepts only the latest recoverable attempt.
- Repeating the same retry returns the existing successor attempt.
- `IDENTITY_VERIFIED` and the transition to `READY_FOR_PAYMENT` are written in the same transaction.
- Provider failure does not modify completed application sections.

## Synthetic document boundary

The service creates only two metadata records: synthetic identity proof and synthetic address proof. Records contain a generated synthetic reference and timestamp. There is no file body, upload URL, real identifier, provider credential, or document-content field.

## Licence ownership

Synthetic learner-licence context is stored in `LicenceRecord`. List and detail queries include `applicantId` in their database predicate. Another authenticated applicant receives the same not-found behavior as a missing licence.

## Security

- Reads require a PostgreSQL-backed session.
- Start and retry require exact Origin, the HttpOnly session, and the session-bound CSRF token.
- Route Handlers validate UUID path parameters and return shared Zod response contracts.
- No provider scenario, workflow state, or ownership claim is accepted from the request body.
- All responses are `no-store` and carry a sanitized `x-request-id`.

## Verification

Run lint, typecheck, unit/Route Handler tests, OpenAPI drift, Prisma validation, and a production build. Disposable database tests additionally prove failure preservation, retry convergence, duplicate retry idempotency, and cross-user licence denial when `TEST_DATABASE_URL` is explicitly approved.
