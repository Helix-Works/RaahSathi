# RaahSathi — Backend Phase Plan

**Owner:** Person B — Backend / Security & Data

**Scope:** `apps/api/**`, Prisma/PostgreSQL, backend contracts, migrations, seeds, security, and backend tests

**Status:** Supplementary implementation roadmap

**Authority:** `AGENTS.md` and `PLAN.md` remain authoritative and override this file if any conflict is found.

## 1. Purpose

This document converts the Round 1 requirements in `AGENTS.md`, `PLAN.md`, and `README.md` into reviewable backend delivery phases using the current repository structure.

RaahSathi remains:

- an independent Delhi-focused proof of concept;
- browser-based and citizen-facing;
- synthetic-data-only;
- a pnpm-workspace modular monolith;
- a NestJS REST API under `/api/v1`;
- backed by Prisma and PostgreSQL on Neon;
- explicit about which external/provider actions are simulated.

This plan does not authorize architecture, scope, dependency, security, ownership, migration, Hindi, or testing changes. Those require the permission process defined in `AGENTS.md`.

## 2. Current backend baseline

Current paths:

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── common/
│   ├── config/
│   ├── modules/health/
│   ├── app.module.ts
│   └── main.ts
├── test/
├── package.json
└── tsconfig.json
```

Already scaffolded on `main`:

- NestJS and strict TypeScript;
- REST prefix `/api/v1`;
- Swagger/OpenAPI in non-production environments;
- strict global DTO validation;
- credentialed CORS with one configured web origin;
- health endpoint;
- Prisma configured for PostgreSQL;
- Jest and Supertest;
- pnpm workspace commands.

Pending API-foundation pull request:

- shared production/E2E bootstrap;
- safe, localization-ready error envelope;
- sanitized correlation IDs;
- E2E verification of unknown-field rejection and safe errors.

Not implemented yet:

- Prisma database module and migrations;
- authentication, CSRF, sessions, and rate limiting;
- applications and workflow state;
- identity, licences, and synthetic document metadata;
- payment convergence;
- RTO availability and transactional appointments;
- FIFO waitlist and temporary offers;
- complete audit/history infrastructure;
- production deployment and observability.

## 3. Target backend structure

Create modules only when their phase begins. Do not add empty enterprise-style abstractions.

```text
apps/api/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── common/
│   │   ├── auth/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── http/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── validation/
│   ├── config/
│   ├── database/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── modules/
│   │   ├── health/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── applicants/
│   │   ├── applications/
│   │   ├── identity/
│   │   ├── licences/
│   │   ├── payments/
│   │   ├── appointments/
│   │   ├── waitlist/
│   │   └── legacy/
│   ├── app.module.ts
│   ├── configure-application.ts
│   └── main.ts
└── test/
    ├── fixtures/
    ├── helpers/
    └── *.e2e-spec.ts
```

`packages/contracts` may receive generated or genuinely stable wire types. NestJS OpenAPI remains the authoritative API contract. Business logic must not move into the contracts package.

## 4. Cross-phase invariants

Every backend phase must preserve these rules:

1. The browser is untrusted and never controls eligibility, workflow status, fee amount, payment success, appointment capacity, waitlist order, or authorization.
2. Every private query and mutation is scoped to the authenticated applicant on the server.
3. Retryable mutations use persisted idempotency state where network ambiguity or replay is possible.
4. Consequential state changes use PostgreSQL constraints and transactions in addition to application checks.
5. Application, payment, identity, appointment, waitlist, offer, and audit history is append-only.
6. Errors expose stable codes, localization keys, and correlation IDs without raw stacks, SQL, provider data, or secrets.
7. No OTP, session token, CSRF secret, document content, or prohibited identity data appears in logs, URLs, audit metadata, screenshots, or client caches.
8. External payment, OTP/Aadhaar, RTO, licence, and provider data is synthetic and visibly recorded as simulated.
9. Stored timestamps use UTC; citizen-facing Delhi dates and times use `Asia/Kolkata`.
10. No general workflow engine, microservice split, Redis, Kafka, CQRS, event sourcing, Kubernetes, or distributed job platform is introduced without approval.

## 5. Phase 0 — Backend foundation

### Objective

Make the API start consistently, validate configuration, connect to PostgreSQL, expose an authoritative OpenAPI document, and fail safely.

### Deliverables

- Merge the pending safe-error/correlation-ID API foundation.
- Add `PrismaModule` and `PrismaService` under `src/database/`.
- Validate `DATABASE_URL`, `NODE_ENV`, `PORT`, and `WEB_ORIGIN` at startup.
- Require a TLS-compatible PostgreSQL configuration in deployed environments.
- Keep `GET /api/v1/health` as lightweight liveness.
- Add `GET /api/v1/health/ready` for database readiness.
- Connect and disconnect Prisma through NestJS lifecycle hooks.
- Add the first real migration containing the minimal Phase 1 persistence models.
- Ensure runtime and E2E tests use the same prefix, pipes, filters, and middleware.
- Document the health, readiness, and safe-error responses in OpenAPI.

### Initial models

- `Applicant`
- `AuthAttempt`
- `Session`
- `AuditEvent`

Only fields needed by Phase 1 should be created. Do not add speculative tables.

### Tests

- valid and invalid environment configuration;
- liveness without a database query;
- readiness success and database-unavailable response;
- Prisma lifecycle behavior;
- unknown-field DTO rejection;
- safe 404 and 500 envelopes;
- safe and unsafe caller-provided correlation IDs.

### Exit gate

- a fresh checkout installs and builds;
- an empty PostgreSQL database migrates successfully;
- the API starts with valid configuration and rejects invalid configuration;
- Swagger/OpenAPI loads in development;
- lint, typecheck, unit tests, E2E tests, build, and Prisma validation pass.

## 6. Phase 1 — Authentication, sessions, and security

### Objective

Deliver synthetic OTP login with secure PostgreSQL-backed opaque sessions.

### Data model

`Applicant`:

- UUID identifier;
- normalized synthetic mobile lookup value or keyed lookup hash;
- masked mobile display value;
- preferred locale;
- creation and update timestamps.

`AuthAttempt`:

- applicant or normalized mobile lookup;
- hashed OTP;
- expiry timestamp;
- remaining attempts;
- resend-available timestamp;
- consumed timestamp;
- result code;
- creation timestamp.

`Session`:

- applicant owner;
- hashed opaque session token;
- session-bound CSRF secret or hash;
- issued, last-seen, idle-expiry, and absolute-expiry timestamps;
- revoked timestamp;
- rotation metadata.

`AuditEvent`:

- actor/applicant identifier where applicable;
- event type;
- resource type and identifier;
- sanitized metadata;
- correlation ID;
- immutable creation timestamp.

### API

```text
POST /api/v1/auth/request-otp
POST /api/v1/auth/verify-otp
POST /api/v1/auth/logout
GET  /api/v1/me
```

### Security rules

- Normalize mobile input server-side.
- Store only synthetic mobile values in seeds, tests, demos, and deployment.
- Hash OTPs and session tokens at rest.
- Apply OTP expiry, one-time use, attempt limits, resend cooldown, and rate limits.
- Rotate session state after authentication.
- Enforce idle and absolute session expiry.
- Set an opaque HttpOnly cookie; use `Secure` in deployed environments.
- Bind CSRF validation to the authenticated session.
- Protect all cookie-authenticated mutations from CSRF.
- Use exact credentialed CORS origins, never `*`.
- Do not reveal whether an arbitrary mobile number exists.

### Tests

- valid, invalid, expired, and consumed OTP;
- exhausted attempts and resend cooldown;
- authentication rate limiting;
- session creation, rotation, persistence, expiry, logout, and revocation;
- missing authentication rejection;
- CSRF rejection;
- disallowed cross-origin credentialed request;
- no OTP/session leakage in error or audit output.

### Exit gate

A synthetic applicant can log in, renew the browser session safely, call `/me`, and log out without any browser-stored auth token.

## 7. Phase 2 — Durable applications

### Objective

Implement resumable Learner Licence and Permanent Driving Licence application workflows.

### Models

- `Application`
- `ApplicationSection`
- `ApplicationEvent`

### API

```text
GET   /api/v1/services
POST  /api/v1/applications
GET   /api/v1/applications
GET   /api/v1/applications/:id
PATCH /api/v1/applications/:id/sections/:sectionKey
POST  /api/v1/applications/:id/steps/:stepKey/complete
```

### Rules

- Begin with `LEARNER_LICENCE` and `PERMANENT_DRIVING_LICENCE`.
- Enforce ownership on every route and query.
- Persist section drafts independently from step completion.
- Validate each service/section with explicit DTOs.
- Reject unknown section fields.
- Implement explicit workflow transitions rather than a generic workflow engine.
- Derive `status`, `progress`, `nextAction`, and `blockingReason` on the backend.
- Record every accepted transition as an immutable event.
- Make safe retries idempotent.

### Tests

- create, list, and get applications;
- cross-user read and mutation denial;
- section save and replacement;
- resume after logout and a new session;
- malformed and unexpected section rejection;
- valid and invalid transitions;
- duplicate step-completion retry;
- backend-derived status and next action;
- immutable application history.

### Exit gate

Demonstrate start, save, logout, return, and resume without replaying a mutation or losing completed progress.

## 8. Phase 3 — Synthetic documents, identity, and licences

### Objective

Represent synthetic document metadata, provider recovery, and licence context without accepting real identity documents.

### Models

- `DocumentRecord`
- `IdentityAttempt`
- `Licence`

### Identity outcomes

```text
VERIFIED
OTP_INVALID
USER_MISMATCH
TIMEOUT
PROVIDER_UNAVAILABLE
RETRY_REQUIRED
```

### API

```text
POST /api/v1/applications/:id/identity-attempts
GET  /api/v1/applications/:id/identity-attempts/latest
POST /api/v1/identity-attempts/:id/retry
GET  /api/v1/licences
```

### Rules

- Store synthetic document metadata only; do not accept arbitrary uploads.
- Persist provider outcomes and visibly mark them as simulated.
- Preserve unrelated application progress during provider failure.
- Make retry and duplicate success safe.
- Advance a workflow at most once after verification.
- Enforce applicant ownership for identity, document, and licence records.

### Tests

- provider unavailable preserves progress;
- timeout and user mismatch remain explicit;
- retry succeeds safely;
- duplicate success does not double-advance;
- cross-user access is denied;
- audit output contains no document contents or secret provider data.

## 9. Phase 4 — Fee snapshots and payment convergence

### Objective

Implement server-authoritative synthetic fees and reliable payment convergence.

### Models

- `FeeSnapshot`
- `PaymentAttempt`
- `PaymentProviderEvent`

### Provider scenarios

```text
SUCCESS
DELAYED_SUCCESS
DUPLICATE_CALLBACK
FAILED
PROVIDER_UNAVAILABLE
```

### API

```text
POST /api/v1/applications/:id/payments
GET  /api/v1/payments/:id
```

Simulation events must use a protected deterministic backend mechanism and must not appear as normal citizen controls.

### Rules

- Calculate fees on the server.
- Persist the exact fee snapshot presented to the citizen.
- Ignore client claims about amount or success.
- Persist and authenticate simulated provider events before processing.
- Deduplicate events using a stable provider-event identifier.
- Transactionally update the payment, application, and history.
- Advance an application exactly once for one logical successful payment.
- Converge correctly when the browser closes or never receives a redirect.

### Tests

- amount tampering;
- duplicate, delayed, reordered, replayed, and spoofed events;
- failed and unavailable provider states;
- browser-absent success;
- cross-user payment access;
- exactly-once application advancement.

## 10. Phase 5 — RTO availability and appointments

### Objective

Provide transparent synthetic Delhi RTO availability and concurrency-safe booking.

### Models

- `Rto`
- `AppointmentSlot`
- `Appointment`

### Availability codes

```text
AVAILABLE
CAPACITY_FULL
SLOTS_NOT_RELEASED
CENTER_UNAVAILABLE
BOOKING_SERVICE_UNAVAILABLE
```

### API

```text
GET  /api/v1/rtos
GET  /api/v1/rtos/:id/availability?month=YYYY-MM&service=...
GET  /api/v1/rtos/:id/slots?date=YYYY-MM-DD&service=...
POST /api/v1/appointments
GET  /api/v1/appointments
POST /api/v1/appointments/:id/cancel
```

### Rules

- Seed multiple synthetic Delhi RTOs and distinct availability states.
- Treat calendar capacity as informational, never authoritative for booking.
- Recheck applicant eligibility and capacity inside the booking transaction.
- Use PostgreSQL row locking or an atomic conditional update.
- Use parameterized raw SQL only when Prisma cannot safely express the lock.
- Prevent duplicate active bookings through database constraints.
- Release cancelled capacity exactly once.
- Record booking and cancellation history.

### Mandatory race test

Create a slot with one remaining place and submit two concurrent eligible booking requests. Exactly one appointment may succeed.

## 11. Phase 6 — FIFO waitlist and temporary offers

### Objective

Provide a preference-aware fallback when direct booking cannot satisfy an applicant.

### Models

- `WaitlistEntry`
- `SlotOffer`
- `AllocationEvent`, only if required to support audit and replay tests

### Preferences

- service;
- RTO;
- acceptable date range;
- time bucket;
- vehicle class where applicable.

### API

```text
POST   /api/v1/waitlist
GET    /api/v1/waitlist/:id
PATCH  /api/v1/waitlist/:id
DELETE /api/v1/waitlist/:id
POST   /api/v1/offers/:id/accept
POST   /api/v1/offers/:id/decline
```

### Allocation rules

- Direct booking remains the primary path.
- Persist an immutable queue join timestamp.
- Choose the earliest compatible eligible entry.
- Use a stable identifier as the tie-breaker for identical timestamps.
- Create one server-timed offer with a 30-minute lifetime.
- Atomically reserve capacity for the offer.
- Reject expired, declined, or consumed offers.
- Release or reallocate capacity exactly once.
- Use lazy expiry or a small approved scheduler; do not add a distributed job system.

### Tests

- strict FIFO among compatible entries;
- preference filtering;
- earlier incompatible entry does not block a later compatible entry;
- duplicate allocation prevention;
- duplicate and concurrent acceptance;
- expiry and decline;
- capacity release and reallocation;
- cross-user waitlist and offer denial.

## 12. Phase 7 — Hero-journey composition

### Objective

Compose existing modules into the primary demonstration without duplicating business logic.

```text
synthetic login
→ learner application
→ durable resume
→ learner completion
→ permanent-licence eligibility
→ RTO calendar
→ no suitable slot
→ waitlist
→ 30-minute offer
→ acceptance
→ confirmed appointment
```

### Backend deliverables

- deterministic synthetic seed;
- partially completed learner application;
- payment delayed/duplicate scenarios;
- multiple RTO availability states;
- one direct-booking scenario;
- one waitlist/offer scenario;
- repeatable `pnpm demo:reset` command;
- documented seed identifiers that are safe for screenshots and demos.

Normal citizen APIs must not expose reset controls or hidden provider simulation switches.

### Exit gate

The entire journey can be repeated from a clean synthetic seed without manual database editing.

## 13. Phase 8 — P1 services by reuse

Begin only after P0 behavior and mandatory tests are stable.

### Services

- Renewal;
- Duplicate or Replacement DL;
- Change of Address;
- Mobile Number Update;
- persisted 5–10 question learner test;
- synthetic legacy lookup and reconciliation request/status.

### Reuse requirements

Each service must reuse authentication, ownership authorization, applications, section drafts, workflow transitions, identity, fee snapshots, payments, status/history, and audit events.

Additional models may include:

- `LearnerTestAttempt`;
- `LearnerTestAnswer`;
- `LegacyLicenceRecord`;
- `ReconciliationRequest`.

Do not add an admin/operator resolution UI in Round 1. Never silently merge an ambiguous legacy record.

## 14. Phase 9 — Security and correctness gate

Security is implemented continuously; this phase is the final release gate.

### Backend review

- no unscoped private-resource query;
- CSRF protection on every cookie-authenticated mutation;
- exact CORS allowlist;
- authentication, OTP, payment, identity, appointment, waitlist, and offer rate limits;
- strict DTO validation and unknown-field rejection;
- no stack, SQL, OTP, token, document, or provider-secret leakage;
- secure production session cookie;
- security headers and tested CSP integration;
- required foreign keys, uniqueness constraints, checks, indexes, and transactions;
- append-only history and sanitized audits;
- bounded pagination and no N+1 queries on demonstrated paths;
- idempotency for every retryable consequential mutation.

### Mandatory automated scenarios

1. Cross-user authorization denial.
2. Durable application resume.
3. Invalid workflow-transition rejection.
4. Duplicate payment event.
5. Delayed payment with the browser absent.
6. Client amount tampering.
7. Final-slot concurrency race.
8. Distinct availability reasons.
9. Compatible strict FIFO allocation.
10. Incompatible-entry filtering.
11. Offer expiry and duplicate acceptance.
12. Identity failure and safe retry.
13. CSRF rejection.
14. Cross-origin credential rejection.
15. Unexpected DTO-field rejection.
16. Sanitized append-only audit history.
17. English Playwright hero journey.
18. Hindi Playwright hero journey.

No known P0 correctness or security failure may remain open at exit.

## 15. Phase 10 — Deployment and submission

### Infrastructure

- Neon PostgreSQL;
- managed Node hosting such as Railway;
- Vercel frontend;
- HTTPS between every component;
- exact production origins;
- Secure session cookies and production CSRF behavior;
- safe migration and deterministic seed process;
- liveness and readiness checks;
- sanitized structured logs with correlation IDs.

### Deployment sequence

1. Provision Neon and store credentials only in server-side environment configuration.
2. Validate backup/recovery and migration procedure.
3. Apply Prisma migrations.
4. Seed synthetic demo data.
5. Deploy NestJS.
6. Verify liveness and readiness.
7. Configure the Next.js deployment with the public API URL.
8. Verify cookie, CSRF, CORS, and TLS behavior across real domains.
9. Run English and Hindi hero journeys at mobile width.
10. Rehearse the deterministic reset and two-minute demo.

### Backend release acceptance

- no secret is present in source control or a browser bundle;
- sessions survive API restarts because state is persisted in PostgreSQL;
- payment converges without browser authority;
- final-slot concurrency is correct against PostgreSQL;
- waitlist FIFO and offer expiry are correct;
- logs contain correlation IDs without sensitive values;
- migrations work from an empty database;
- reset and seed use synthetic data only;
- claims in README, demo, and submission match actual behavior.

## 16. Pull-request sequence

Use one reviewable branch and squash-merged pull request per bounded slice:

1. `feat/api-db-foundation`
2. `feat/api-auth-sessions`
3. `feat/api-application-workflows`
4. `feat/api-identity-licences`
5. `feat/api-payment-convergence`
6. `feat/api-appointment-booking`
7. `feat/api-waitlist-offers`
8. `feat/api-demo-seed`
9. `feat/api-p1-services`
10. `chore/api-security-release-gate`
11. `chore/api-production-deployment`

Every pull request must identify:

- owner and priority;
- public API and OpenAPI changes;
- schema and migration changes;
- authorization boundaries;
- idempotency and concurrency behavior;
- simulation boundary;
- environment-variable changes;
- automated and manual verification;
- migration recovery or deployment ordering where applicable.

## 17. Per-phase quality command

Run the affected checks during development and the complete backend gate before every pull request:

```bash
pnpm --filter @raahsathi/api lint
pnpm --filter @raahsathi/api typecheck
pnpm --filter @raahsathi/api test
pnpm --filter @raahsathi/api test:e2e
pnpm --filter @raahsathi/api build
pnpm --filter @raahsathi/api prisma:validate
```

Race, transaction, and migration tests must run against PostgreSQL. External network access must not be required for deterministic CI tests.
