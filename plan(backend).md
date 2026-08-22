# RaahSathi — Next.js Route Handler Backend Plan

**Owner:** Person B — Server, Security, and Data

**Scope:** `apps/web/src/app/api/**`, `apps/web/src/server/**`, `apps/web/prisma/**`, server contracts, migrations, synthetic seeds, and server correctness tests

**Authority:** `AGENTS.md` and `PLAN.md` override this roadmap.

## Architecture

```text
Browser
→ same-origin Next.js /api/v1 Route Handler
→ server-only use case/service
→ repository/Prisma transaction
→ Neon PostgreSQL
```

Route files parse transport input and call one use case. They do not contain reusable business rules or issue unscoped Prisma queries. Server Components call server services directly; browser code uses `/api/v1`.

Route Handlers use the Node.js runtime and may be serverless. Never keep authoritative state in module memory or the filesystem. Do not require an always-running process. Temporary offers expire through transactional checks whenever they are read, accepted, declined, or reallocated; a protected bounded scheduled invocation may be added only with approval.

## Contract and HTTP rules

- Preserve REST `/api/v1`.
- Strict Zod schemas own request and response contracts.
- Register each public endpoint in the OpenAPI registry.
- Run `pnpm openapi:generate` after contract changes and `pnpm openapi:check` in CI.
- Reject unknown fields, malformed JSON, unsupported content types, and oversized bodies.
- Return stable error codes, localization keys, and correlation IDs.
- Never return raw stacks, SQL, credentials, OTPs, document data, or provider details.
- Use same-origin cookies. Every cookie-authenticated mutation requires a session-bound CSRF token and exact Origin validation.
- Route Handlers must re-check ownership and consequential state inside the database transaction.

## Phase 0 — Foundation

- Prisma schema and migrations under `apps/web/prisma`.
- Development-safe Prisma singleton for connection reuse only; never use it as state storage.
- `GET /api/v1/health` for liveness.
- `GET /api/v1/health/ready` for bounded PostgreSQL readiness.
- Shared request ID, safe error, body validation, Origin, and endpoint-registry utilities.
- Vitest Route Handler/service tests and Playwright health smoke test.

Exit: install, Prisma generation/validation, OpenAPI drift, lint, typecheck, tests, build, and Playwright pass. Database-connected checks may be reported as blocked when no safe test URL exists; production is never contacted.

## Phase 1 — Authentication, sessions, and ownership

Models: `Applicant`, `AuthAttempt`, `Session`, `AuditEvent`.

Handlers:

```text
POST /api/v1/auth/request-otp
POST /api/v1/auth/verify-otp
POST /api/v1/auth/logout
GET  /api/v1/me
```

Implement normalized synthetic mobile lookup, hashed OTPs and session tokens, expiry/attempt/resend limits, opaque PostgreSQL-backed sessions, secure HttpOnly cookies, rotation, logout/revocation, CSRF binding, exact Origin checks, rate limits, sanitized audit, and non-enumerating auth errors.

Tests cover valid/invalid/expired/consumed OTP, cooldown, rate limits, session lifecycle, missing auth, CSRF, cross-origin mutation, and secret leakage.

## Phase 2 — Durable applications

Models: `Application`, `ApplicationSection`, `ApplicationEvent`.

Handlers preserve the planned create/list/get, section-save, and step-completion paths. Server use cases derive status, progress, next action, and blocking reason. Draft saving is independent from transition completion. Ownership is applied in every query, accepted transitions append immutable events, and safe retries are idempotent.

Tests cover cross-user denial, save/logout/re-authenticate/resume, malformed fields, invalid transitions, duplicate completion, derived status, and history.

## Phase 3 — Documents, identity, and licences

Models: `DocumentRecord`, `IdentityAttempt`, `Licence`.

Accept synthetic metadata only. Persist simulated outcomes `VERIFIED`, `OTP_INVALID`, `USER_MISMATCH`, `TIMEOUT`, `PROVIDER_UNAVAILABLE`, and `RETRY_REQUIRED`. Provider failure preserves progress; retry and duplicate success advance at most once.

## Phase 4 — Payment convergence

Models: `FeeSnapshot`, `PaymentAttempt`, `PaymentProviderEvent`.

The server calculates fees, authenticates simulated provider events, deduplicates stable event IDs, and transactionally updates payment, application, and history. Browser redirect state is never authoritative. Test tampering, delayed success, duplicate/reordered/replayed/spoofed events, browser absence, ownership, and exactly-once advancement.

## Phase 5 — RTO availability and booking

Models: `Rto`, `AppointmentSlot`, `Appointment`.

Expose month/day availability with distinct reason codes. Displayed capacity is informational. Booking re-checks eligibility and capacity with PostgreSQL locking or an atomic conditional write, prevents duplicate active bookings through constraints, and releases cancellations once.

Mandatory race: two eligible requests compete for one remaining place; exactly one succeeds.

## Phase 6 — FIFO waitlist and offers

Models: `WaitlistEntry`, `SlotOffer`, and `AllocationEvent` only when audit requirements need it.

Persist immutable join time and compatibility preferences. Select the earliest compatible entry with a stable tie-break. Atomically reserve capacity for one 30-minute offer. Every read or mutation first expires stale offers transactionally. Reject duplicate/concurrent acceptance and release capacity exactly once after decline or expiry.

## Phase 7 — Demo and security gate

Provide deterministic synthetic seed/reset behavior without exposing controls to citizens. Compose login, learner application, durable resume, eligibility, availability, waitlist, offer, and confirmation from shared use cases.

Run cross-user authorization, resume, transition, payment, final-slot race, availability, FIFO, offer expiry, identity retry, CSRF, Origin, malformed-input, audit-sanitization, and English/Hindi Playwright scenarios.

## Deployment

1. Provision Neon and keep credentials server-only.
2. Apply reviewed Prisma migrations through a controlled deployment step.
3. Deploy the single Next.js application to Vercel.
4. Verify Node runtime, pooled database connectivity, readiness, secure cookies, CSRF/Origin behavior, and security headers.
5. Run mobile English/Hindi journeys against production-like deployment.

No production migration, destructive reset, new worker platform, separate API service, Redis, Kafka, or microservice split is authorized by this roadmap.

## Per-change quality gate

```bash
pnpm prisma:generate
pnpm prisma:validate
pnpm openapi:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```
