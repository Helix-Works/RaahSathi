# Phase 1 authentication and session workflow

RaahSathi accepts seeded synthetic applicants only. The standard demonstration uses mobile `9000000000` and OTP `123456`; `9000000002` deterministically demonstrates provider unavailability. No SMS is sent and real personal data must not be entered.

## Request and verification

`POST /api/v1/auth/request-otp` normalizes the submitted number in memory, stores only an HMAC lookup value, and creates a five-minute `AuthAttempt`. Requests have a sixty-second resend cooldown and a database-backed limit of three per fifteen minutes. OTPs are HMACed with a per-attempt salt and a server-only pepper.

`POST /api/v1/auth/verify-otp` locks the challenge transactionally. A challenge has five attempts, is consumed once, and cannot create two sessions under concurrent verification. Unknown mobile numbers receive an indistinguishable challenge response but can never create an applicant or session.

## Session lifecycle

Successful verification creates an opaque 32-byte token. Only its SHA-256 hash is stored. The raw value is sent in the `raahsathi_session` HttpOnly, SameSite=Lax cookie. Sessions have a 30-minute idle lifetime, an eight-hour absolute lifetime, and a five-minute database touch interval. Login rotates a session already presented by the same browser; logout persists revocation.

Server Components resolve sessions directly through `src/server/auth/session-service.ts`. Browser clients use `/api/v1`; no server HTTP loopback or browser token storage is used.

## CSRF and Origin

The separate `raahsathi_csrf` cookie is readable by same-origin JavaScript. The API client copies it into `x-csrf-token` for mutations. Authenticated mutations require exact Origin, a valid session, equal cookie/header values, and a hash matching the session-bound database value.

## Ownership and audit

Private services receive an authenticated `{ sessionId, applicantId }` context and scope resource queries by `applicantId`. Cross-user access is rejected server-side. Audit metadata is allowlisted and never includes mobile values, lookup hashes, OTP material, cookie values, session/CSRF tokens, raw headers, bodies, or exception details.

## Local setup

Set the PostgreSQL URLs and all three server-only auth variables from `.env.example`, apply migrations only to a disposable/local database, then run `pnpm prisma:seed`. Database tests require a distinct normalized `TEST_DATABASE_URL` plus the exact `TEST_DATABASE_DISPOSABLE_CONFIRMATION` acknowledgement; the runner fails closed when either is missing or the test identity matches `DATABASE_URL`.

Production migrations and resets are outside Phase 1 implementation authorization.
