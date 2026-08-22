# RaahSathi — AGENTS.md

> **Authority:** This file and `PLAN.md` are the supreme project instructions for Round 1.
> **Project:** RaahSathi
> **Hackathon:** Build What Moves India
> **Round 1 deadline:** 28 August 2026, 8:00 p.m. IST
> **Team:** 2 people
> **Scope:** Browser-based, Delhi-only, independent driving-licence public-service PoC using synthetic data only.

## 1. Supreme-authority rule

RaahSathi is a **fresh implementation**. Previous repositories, scaffolds, phases and source code from the earlier four-person project are not authoritative. Earlier research remains useful only as problem/service input.

`AGENTS.md` and `PLAN.md` must never be silently changed, bypassed or superseded by Codex.

If implementation appears to require changing architecture, stack, security, ownership, scope, migrations or these files, Codex must:

1. stop before making the conflicting change;
2. state the exact conflict;
3. explain the smallest proposed change and its consequences;
4. explicitly ask for permission;
5. wait for approval.

Always ask first before changing:
- Next.js / NestJS / PostgreSQL / Prisma;
- frontend/backend ownership;
- auth/session or authorization model;
- REST `/api/v1` strategy;
- security guarantees;
- Hindi requirement;
- synthetic-data-only rule;
- Round 1 priorities or scope cuts;
- critical testing requirements;
- significant dependencies;
- destructive migrations;
- `AGENTS.md` or `PLAN.md`.

## 2. Product and hackathon context

RaahSathi is an independent PoC that rethinks the citizen experience for digital driving-licence services. It is not an official government service.

Round 1 requires a live public browser app, a two-minute video, a short text summary and partner details. The project should therefore demonstrate a small number of **real systemic improvements** across as many useful services as can safely reuse them.

The product must:
- clearly disclose that it is an independent prototype;
- use only synthetic people, licences, payments, documents, RTOs and provider events;
- never use official emblems/branding or imply government affiliation;
- never claim formal compliance, certification or “government-grade security”;
- describe its security as production-oriented PoC design for sensitive public-service workflows.

## 3. Six problem areas RaahSathi is designed to address

### 3.1 Payment-state inconsistency
Problem: external payment can succeed while the application remains pending.

Required redesign behavior:
- browser is never authoritative for payment success;
- delayed/duplicate provider results are safe;
- one logical successful payment advances the application exactly once;
- closing the browser does not break convergence.

Do not claim the existing system definitely lacks webhooks/idempotency; exact internals were not verified.

### 3.2 Fragile workflow recovery
Problem: navigation/re-entry can produce form-resubmission/restart behavior.

Required redesign behavior:
- application progress is durable backend state;
- completed sections survive refresh, logout, browser restart and session renewal;
- re-entry never requires replaying an unsafe mutation;
- status and next action are reconstructed from the database.

### 3.3 Downtime/slowness/failure resilience
Do not claim the existing service has “one old server” or no scaling. Historical material already indicates centralized infrastructure with horizontal scaling.

Round 1 should instead demonstrate:
- small failure blast radius;
- explicit dependency states;
- graceful degradation;
- bounded retries;
- unrelated workflows staying usable when a simulated provider fails.

### 3.4 Legacy licence gaps
Round 1 may implement a small synthetic:
`canonical search -> possible legacy match -> reconciliation request -> request status`
flow.

Never silently merge ambiguous records. No admin resolution UI is required in Round 1.

### 3.5 Aadhaar/OTP/e-sign recovery
Do not claim RaahSathi can make an external identity provider always available.

Model outcomes explicitly and preserve workflow state:
`VERIFIED`, `OTP_INVALID`, `USER_MISMATCH`, `TIMEOUT`, `PROVIDER_UNAVAILABLE`, `RETRY_REQUIRED`.

### 3.6 Opaque appointment availability
Primary experience:
`service -> RTO -> calendar -> date -> time slots/capacity -> direct booking`.

Unavailable states must be explicit, e.g.:
- `CAPACITY_FULL`
- `SLOTS_NOT_RELEASED`
- `CENTER_UNAVAILABLE`
- `BOOKING_SERVICE_UNAVAILABLE`

Waitlist is a fallback, not the primary booking path.

## 4. Product principles

Every implemented citizen journey should answer:
1. What is my current status?
2. What should I do next?
3. Why can I not continue?
4. When can I continue, if known?
5. Is my progress safe?
6. What is simulated?

Build shared primitives instead of disconnected service-specific implementations.

## 5. Round 1 priorities

### P0 — must genuinely work
- synthetic mobile OTP login;
- PostgreSQL-backed secure sessions;
- server-side ownership authorization;
- New Learner Licence;
- Permanent Driving Licence;
- durable section drafts and resume;
- backend-derived status / next action / blocking reason;
- immutable application history/audit;
- fee snapshot + simulated payment;
- idempotent payment convergence;
- multiple seeded Delhi RTOs;
- calendar availability;
- time-slot capacity;
- explicit availability reasons;
- concurrency-safe booking;
- preference-aware strict-FIFO waitlist;
- temporary slot offers;
- English **and Hindi for every implemented citizen-facing flow**;
- critical automated security/correctness tests;
- deployed public citizen UI/API.

### P1 — add by reuse after P0 is stable
- Renewal;
- Duplicate/Replacement DL;
- Change of Address;
- Mobile Number Update;
- small persisted 5–10 question learner test;
- synthetic legacy lookup + reconciliation request/status.

### P2 — only after P0/P1 stability
- OpenAI help/explanation assistant;
- deeper legacy/test features;
- extra visual effects;
- lower-value catalogue breadth.

Codex must not cut scope itself. If schedule pressure requires a cut, report it and ask permission. Hindi is not a cut candidate.

## 6. Team roles

### Person A — Frontend / Citizen Experience Owner
Background: stronger Flutter/UI experience; learning React/Next.js.

Owns:
- `apps/web/**`
- Next.js citizen app;
- mobile-first UX;
- Tailwind + shadcn/ui;
- selective Aceternity UI;
- React Hook Form + Zod;
- English/Hindi presentation;
- login/dashboard/services;
- guided forms;
- save/resume UX;
- status/history;
- payment and identity recovery UI;
- RTO/calendar/time-slot UI;
- waitlist/offer UI;
- licence/legacy citizen screens;
- API integration;
- frontend accessibility/security hygiene;
- Vercel deployment;
- visible demo journey.

Frontend must never be authoritative for eligibility, payment success, capacity, queue order, authorization or workflow transitions.

### Person B — Backend / Security & Data Owner
Background: more familiar with JavaScript/backend development.

Owns:
- `apps/api/**`
- NestJS;
- Prisma/PostgreSQL/Neon;
- schema/migrations/seeds;
- authentication/session infrastructure;
- CSRF/CORS/rate limits;
- resource ownership authorization;
- REST/OpenAPI;
- workflows/status derivation;
- payments;
- identity provider simulation;
- appointments/capacity/transactions;
- waitlist/offers;
- licences/legacy;
- audit/history;
- Jest/Supertest/race tests;
- API/database deployment.

### Shared
- API contracts/OpenAPI generated types;
- E2E tests;
- demo seed/scenario;
- deployment integration;
- submission;
- any permission-gated change.

Codex should stay in the assigned owner’s area. Do not casually refactor the other owner’s code.

## 7. Locked architecture

Frontend:
- Next.js + TypeScript
- Tailwind CSS
- shadcn/ui
- Aceternity UI selectively
- React Hook Form
- Zod

Backend:
- NestJS + TypeScript
- REST `/api/v1`
- NestJS Swagger/OpenAPI
- strict NestJS DTO validation

Database:
- PostgreSQL on Neon
- Prisma
- one product DB

Authentication:
- synthetic OTP;
- opaque server-managed sessions persisted in PostgreSQL;
- secure HttpOnly cookie;
- no auth tokens in `localStorage`/`sessionStorage`.

Deployment target:
- Next.js: Vercel
- NestJS: managed Node host such as Railway
- DB: Neon

Trust path:
`Browser -> HTTPS -> Next.js -> credentialed HTTPS -> NestJS -> server-only Prisma -> PostgreSQL`

Prefer same-site custom app/API subdomains when available. If separate hosting domains require cross-site cookies, preserve Secure cookie + CSRF + strict origin controls rather than weakening security.

## 8. Fresh repository

Preferred shape:

```text
RaahSathi/
├── apps/
│   ├── web/        # Person A
│   └── api/        # Person B
├── packages/
│   └── contracts/  # generated/shared wire artefacts only if needed
├── docs/
├── AGENTS.md
├── PLAN.md
├── README.md
├── package.json
└── pnpm-workspace.yaml
```

Use pnpm workspaces. Prisma should normally live under `apps/api/prisma/`.

Do not recreate the old oversized package structure.

## 9. API and contract rules

NestJS OpenAPI is the authoritative wire contract. Generate frontend TypeScript types where practical.

Representative endpoints:

```text
POST /api/v1/auth/request-otp
POST /api/v1/auth/verify-otp
POST /api/v1/auth/logout
GET  /api/v1/me

GET  /api/v1/services
POST /api/v1/applications
GET  /api/v1/applications
GET  /api/v1/applications/:id
PATCH /api/v1/applications/:id/sections/:sectionKey
POST /api/v1/applications/:id/steps/:stepKey/complete

POST /api/v1/applications/:id/payments
GET  /api/v1/payments/:id

GET  /api/v1/rtos
GET  /api/v1/rtos/:id/availability?month=YYYY-MM
GET  /api/v1/rtos/:id/slots?date=YYYY-MM-DD
POST /api/v1/appointments
POST /api/v1/appointments/:id/cancel

POST   /api/v1/waitlist
GET    /api/v1/waitlist/:id
PATCH  /api/v1/waitlist/:id
DELETE /api/v1/waitlist/:id
POST   /api/v1/offers/:id/accept
POST   /api/v1/offers/:id/decline

GET  /api/v1/licences
GET  /api/v1/legacy/search
POST /api/v1/legacy/reconciliation-requests
GET  /api/v1/legacy/reconciliation-requests/:id
```

Use stable machine-readable error/reason codes and localization keys. Never return raw stacks/SQL/provider secrets.

## 10. Backend rules

Suggested modules:
`auth`, `applications`, `identity`, `payments`, `appointments`, `licences`, `legacy`, `audit`, `common`.

Do not build a universal workflow/rules engine for Round 1.

### Applications
Persist coherent section drafts and immutable transition events.

`status`, `nextAction` and `blockingReason` are backend-derived. Do not allow frontend or arbitrary controllers to independently set citizen presentation status.

### Documents
Synthetic metadata only. Do not accept/store arbitrary real identity documents.

### Identity
Provider is simulated. Failure must not erase unrelated completed steps. Retry must be safe.

### Payments
Server owns amount and status. Support deterministic demo scenarios:
`SUCCESS`, `DELAYED_SUCCESS`, `DUPLICATE_CALLBACK`, `FAILED`, `PROVIDER_UNAVAILABLE`.

Use constraints/idempotency/transactions so one logical payment advances once.

### Appointments
Calendar/day APIs may return aggregate remaining capacity, but displayed capacity is never booking authority.

Booking must re-check authoritative state transactionally. Use PostgreSQL locking/atomic writes/constraints. Parameterized raw SQL is acceptable only when Prisma cannot safely express the required concurrency primitive.

### Waitlist
Preferences include service, RTO, acceptable dates/time buckets and vehicle class where relevant.

Allocation rule:
**strict FIFO by durable join time among compatible applicants**, with a stable tie-breaker only for identical timestamps.

No licence-expiry urgency for the featured first-time driving-test queue.

### Offers
A matching waitlist allocation creates a temporary offer. Round 1 synthetic lifetime: **30 minutes**.

Accepting expired/declined/consumed offers must fail safely. Lazy expiry or a tiny scheduled executor is acceptable; do not add a distributed job platform without approval.

## 11. Security baseline

Browser is untrusted. NestJS is the authoritative application boundary.

Non-negotiable:
- server-side ownership authorization;
- secure HttpOnly session cookie;
- no browser token storage;
- CSRF protection on state-changing cookie-authenticated requests;
- credentialed CORS with exact allowed origins, never `*`;
- strict DTO validation/unknown-field rejection;
- sensitive endpoint rate limits;
- server-only secrets;
- safe public errors;
- appropriate Next.js/NestJS security headers;
- tested CSP that does not break Next.js;
- database foreign keys/uniques/checks/transactions/indexes;
- sanitized structured audit events;
- no real personal/government/payment data.

Do not place OTPs, session tokens, secrets or document contents in logs, URLs or audit metadata.

## 12. Database/migration rules

Prisma migrations are authoritative.

Once meaningful data/schema exists:
- do not use DB reset/push as a substitute for a migration;
- do not silently drop tables/columns;
- do not rewrite applied migrations;
- do not destroy demo data for convenience.

If a destructive migration appears necessary, stop, explain impact/backfill/recovery and ask permission.

A deterministic synthetic seed/reset command such as `pnpm demo:reset` is required. Normal citizen UI must not expose reset/simulation controls.

## 13. Hindi and accessibility

Hindi is mandatory for **every implemented citizen-facing flow**.

API/domain errors should return stable codes/message keys that the frontend can translate.

Use Aceternity only when it does not harm:
- mobile performance;
- keyboard access;
- contrast;
- reduced-motion behavior;
- clarity of forms/status/errors.

shadcn/Tailwind are the accessible baseline.

## 14. Testing — first-class requirement

Do not chase arbitrary coverage percentages. Test the claims that would invalidate the project.

Backend: Jest + NestJS/Supertest.  
Cross-app critical E2E: Playwright.

Mandatory automated tests:
1. User B cannot access User A’s private resources.
2. Saved application survives logout/restart/re-entry.
3. Invalid workflow transition is rejected.
4. Duplicate payment callback/event is harmless.
5. Delayed payment converges once without browser dependence.
6. Client cannot tamper with authoritative amount/status.
7. Two concurrent users cannot both obtain the final slot.
8. Availability reason codes remain distinct.
9. Compatible waitlist allocation is strict FIFO.
10. Expired offer cannot be accepted.
11. Provider failure preserves application progress.
12. Identity retry does not duplicate completion.
13. CSRF rejection works.
14. Unauthorized cross-origin credentialed access is blocked.
15. Unexpected/malformed DTO fields are rejected.
16. Critical audit/history exists without secret leakage.

Before submission, run the hero journey in English and Hindi at mobile width against production-like deployments.

## 15. Codex behavior

For each task:
1. read `AGENTS.md`;
2. read relevant `PLAN.md`;
3. inspect current code;
4. identify owner/path;
5. implement the smallest complete change;
6. add/update relevant tests;
7. run lint/typecheck/tests/build;
8. report exactly what changed and what remains.

Never:
- redesign architecture implicitly;
- add microservices/Redis/Kafka/Kubernetes/CQRS/event sourcing/workflow engines without approval;
- connect frontend directly to DB;
- trust client payment/eligibility/capacity;
- duplicate shared business logic per service;
- build an admin UI in Round 1 unless explicitly requested;
- accept real sensitive data;
- silently weaken security;
- silently cut scope;
- modify these authority files without permission.

## 16. Round 1 definition of done

Round 1 is ready only when:
- public Next.js citizen UI, NestJS API and Neon DB are deployed;
- secure synthetic login/session works;
- English and Hindi work across all implemented citizen flows;
- learner -> permanent journey is demonstrable;
- resume is real;
- payment convergence is real;
- calendar/time capacity is real;
- booking is transactionally safe;
- waitlist FIFO/offer behavior is real;
- status/next action/blocking reason are backend-derived;
- mandatory tests pass;
- no real sensitive data is used;
- demo seed/reset is documented;
- claims match implementation.
