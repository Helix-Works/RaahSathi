# RaahSathi — PLAN.md

**Status:** Authoritative Round 1 implementation plan  
**Planning date:** 22 August 2026  
**Deadline:** 28 August 2026, 8:00 p.m. IST  
**Team:** 2  
**Product:** RaahSathi  
**Scope:** Delhi-only, browser-based, synthetic-data-only citizen PoC.

> Read `AGENTS.md` first. If this plan appears to require an architecture/security/scope change, stop and ask permission rather than deviating.

## 1. Objective

Build a secure, working user-side PoC that addresses the strongest Sarathi failure domains through reusable architecture:

- durable resumable applications;
- backend-derived status/next action/blocking reason;
- reliable simulated payment convergence;
- explicit recoverable identity-provider states;
- RTO calendar + date/time capacity;
- concurrency-safe appointment booking;
- preference-aware strict-FIFO waitlist + temporary offers;
- reuse across multiple important driving-licence services;
- English/Hindi parity;
- strong automated security/correctness tests.

No Round 1 admin/operator UI.

## 2. Team split

### Person A — Frontend / Citizen UX
Owns `apps/web/**`.

Primary deliverables:
- Next.js;
- Tailwind/shadcn;
- selective Aceternity;
- React Hook Form/Zod;
- bilingual UX;
- login/dashboard/services;
- reusable application forms;
- save/resume/status/history;
- payment/identity recovery UI;
- RTO calendar/time slots;
- waitlist/offers;
- licence/legacy screens;
- frontend API integration;
- accessibility/mobile;
- web deployment/demo.

### Person B — Backend / Security & Data
Owns `apps/api/**` and Prisma.

Primary deliverables:
- NestJS REST `/api/v1`;
- OpenAPI;
- Neon/Postgres/Prisma;
- migrations/seeds;
- auth/sessions;
- CSRF/CORS/rate limiting;
- ownership authorization;
- workflows/status derivation;
- payments;
- identity;
- appointments/capacity;
- waitlist/offers;
- licences/legacy;
- audit/history;
- backend/race/security tests;
- API/DB deployment.

### Shared
- API contract generation;
- E2E tests;
- seed/demo scenario;
- deployment integration;
- submission and any approved plan change.

## 3. Locked stack

```text
Browser
  ↓
Next.js + TypeScript
  ↓ credentialed HTTPS
NestJS + TypeScript /api/v1
  ↓
Prisma
  ↓
Neon PostgreSQL
```

Frontend:
- Tailwind
- shadcn/ui
- Aceternity UI selectively
- React Hook Form
- Zod

Testing:
- Jest/Supertest backend
- Playwright critical E2E

Workspace:
- pnpm workspaces

No microservices/Redis/Kafka/Kubernetes/event sourcing/CQRS/general workflow engine/admin UI in Round 1 unless approved.

## 4. Fresh repository

```text
RaahSathi/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── contracts/
├── docs/
├── AGENTS.md
├── PLAN.md
├── README.md
├── package.json
└── pnpm-workspace.yaml
```

Prefer `apps/api/prisma/` for Prisma schema/migrations.

## 5. Scope

### P0
- auth/session/security foundation;
- LL application;
- Permanent DL application;
- durable drafts/resume;
- status/next action/blocking reason/history;
- fees/payment convergence;
- multiple Delhi RTOs;
- calendar availability;
- time-slot capacity;
- availability reason codes;
- transactional booking;
- strict-FIFO compatible waitlist;
- 30-minute offers;
- English/Hindi;
- mandatory tests;
- deployment/reset/demo.

### P1
- Renewal;
- Replacement;
- Address change;
- Mobile update;
- small learner test;
- synthetic legacy lookup/reconciliation request.

### P2
- AI help assistant;
- deeper legacy/test content;
- extra visual polish/other catalogue breadth.

Codex may not cut scope; ask permission.

## 6. Core data model direction

Initial Prisma/domain entities should roughly cover:

```text
Applicant
Session
AuthAttempt

Application
ApplicationSection
ApplicationEvent

DocumentRecord
IdentityAttempt

FeeSnapshot
PaymentAttempt
PaymentProviderEvent

Rto
AppointmentSlot
Appointment
WaitlistEntry
SlotOffer
AllocationEvent (if useful)

Licence
LegacyLicenceRecord
ReconciliationRequest
```

Do not create tables only because they sound enterprise-like. Every model should support a Round 1 use case/test.

Critical invariants should use application checks **and** PostgreSQL constraints/transactions.

## 7. API contract direction

Representative routes:

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

POST /api/v1/applications/:id/identity-attempts
GET  /api/v1/applications/:id/identity-attempts/latest
POST /api/v1/identity-attempts/:id/retry

POST /api/v1/applications/:id/payments
GET  /api/v1/payments/:id

GET  /api/v1/rtos
GET  /api/v1/rtos/:id/availability?month=YYYY-MM&service=...
GET  /api/v1/rtos/:id/slots?date=YYYY-MM-DD&service=...
POST /api/v1/appointments
GET  /api/v1/appointments
POST /api/v1/appointments/:id/cancel

POST   /api/v1/waitlist
GET    /api/v1/waitlist/:id
PATCH  /api/v1/waitlist/:id
DELETE /api/v1/waitlist/:id

POST /api/v1/offers/:id/accept
POST /api/v1/offers/:id/decline

GET  /api/v1/licences
GET  /api/v1/legacy/search
POST /api/v1/legacy/reconciliation-requests
GET  /api/v1/legacy/reconciliation-requests/:id
```

NestJS OpenAPI is authoritative. Generate frontend types/contract artefacts rather than hand-maintaining duplicates where practical.

## 8. Phase 0 — Foundation

**Goal:** both apps start, DB connects, OpenAPI works, bilingual shell exists.

### Person B
- scaffold NestJS;
- strict TS/lint;
- env validation;
- Prisma + Neon;
- first migration;
- `/api/v1` prefix;
- health endpoint;
- global DTO validation;
- OpenAPI;
- correlation/safe-error pattern;
- CORS config;
- Jest/Supertest setup.

### Person A
- scaffold Next.js;
- Tailwind/shadcn;
- bilingual dictionary foundation;
- independent-prototype disclosure;
- mobile shell;
- API fetch wrapper with credentials;
- login/dashboard route shells;
- consume health/public contract.

### Exit
- fresh clone starts both apps;
- web can call API;
- OpenAPI generates;
- no DB secret in frontend;
- builds pass.

## 9. Phase 1 — Auth, Sessions, Security

### Person B
- Applicant/AuthAttempt/Session;
- synthetic OTP;
- request/verify/logout/me;
- opaque DB-backed session;
- auth guard;
- owner-authorization pattern;
- CSRF token/session binding;
- strict credentialed CORS;
- auth rate limits;
- safe auth errors/audit.

### Person A
- bilingual login + OTP;
- clear synthetic-demo labeling;
- credentialed API flow;
- CSRF handling;
- protected routing;
- logout/dashboard shell;
- no browser token storage.

### Tests/exit
- valid/invalid OTP;
- session persistence/revocation;
- missing auth rejected;
- CSRF rejected;
- cross-user resource pattern proven.

## 10. Phase 2 — Durable Applications

### Person B
- Application/ApplicationSection/ApplicationEvent;
- LL + Permanent DL workflow skeleton;
- create/list/get;
- section save;
- safe transitions;
- derived status/progress/nextAction/blockingReason;
- owner-scoped access;
- history.

### Person A
- service catalogue;
- reusable guided form;
- section save;
- visible saved state;
- resume;
- dashboard active application;
- status/next-action card;
- timeline;
- bilingual reason mapping.

### Exit
Demonstrate: start -> save -> logout/close -> return -> continue from backend state with no form replay.

## 11. Phase 3 — Documents, Identity, Licence Context

### Person B
- synthetic DocumentRecord metadata;
- no real file upload;
- IdentityAttempt state machine;
- deterministic provider scenarios;
- start/status/retry;
- safe retry;
- synthetic licence context.

### Person A
- synthetic document UI;
- identity verification/recovery UX;
- mismatch/provider unavailable/retry states;
- licence card;
- Hindi equivalents.

### Tests
Provider failure preserves progress; retry succeeds safely; duplicate success does not double-advance; cross-user licence access denied.

## 12. Phase 4 — Reliable Payment

### Person B
- synthetic fee rules/FeeSnapshot;
- PaymentAttempt/ProviderEvent;
- server-owned amount;
- scenarios:
  `SUCCESS`, `DELAYED_SUCCESS`, `DUPLICATE_CALLBACK`, `FAILED`, `PROVIDER_UNAVAILABLE`;
- idempotency uniqueness;
- validated provider callback/result;
- safe transactional payment + application advancement + event;
- reconciliation/status convergence.

### Person A
- fee breakdown;
- pay/pending/delayed/provider-unavailable/success;
- resume/status refresh;
- bilingual explanations.

### Mandatory tests
- amount tampering;
- duplicate success;
- delayed success;
- browser absent/lost redirect;
- spoofed event;
- cross-user payment access.

## 13. Phase 5 — RTO Calendar and Booking

### Person B
- seed several Delhi RTOs;
- Rto/AppointmentSlot/Appointment;
- month availability aggregation;
- date/time slots;
- reason codes:
  `AVAILABLE`, `CAPACITY_FULL`, `SLOTS_NOT_RELEASED`, `CENTER_UNAVAILABLE`, `BOOKING_SERVICE_UNAVAILABLE`;
- booking transaction;
- DB locking/atomic capacity protection;
- cancellation/release;
- ownership/audit/rate limit.

### Person A
- RTO selector;
- calendar;
- day availability;
- time slots;
- full/unreleased/unavailable explanations;
- book confirmation;
- mobile behavior;
- Hindi.

### Mandatory race test
Create one remaining slot and send two concurrent booking requests. Exactly one booking may succeed.

## 14. Phase 6 — Waitlist and Offers

### Person B
- WaitlistEntry/SlotOffer;
- join/edit/leave;
- preferences: RTO/service/date range/time bucket/vehicle class where relevant;
- immutable join time;
- compatibility matching;
- strict FIFO among compatible applicants;
- stable tie-break;
- 30-minute offer;
- accept/decline/expiry;
- reallocation/capacity correctness;
- audit.

### Person A
- no-suitable-slot fallback;
- change RTO/date before queue;
- waitlist preference form;
- queue status;
- offer + expiry;
- accept/decline;
- confirmed appointment;
- Hindi.

### Mandatory tests
FIFO, compatibility filtering, expired offer, duplicate accept, capacity after decline/expiry.

## 15. Phase 7 — Hero Journey

Compose existing primitives; do not duplicate them.

Hero:
```text
login
→ dashboard
→ learner application
→ show durable resume
→ complete/simulate learner stage
→ Permanent DL eligibility
→ RTO
→ calendar/time capacity
→ full/no-suitable slot
→ join waitlist
→ receive 30-minute offer
→ accept
→ confirmed appointment
```

Person B creates deterministic seed state.  
Person A makes this flow visually obvious and fast enough to demonstrate.

## 16. Phase 8 — P1 Service Breadth

Only after P0 is stable.

### Renewal
Reuse application/licence/docs/payment/status.

### Replacement
Reuse licence/application/docs/payment/status.

### Address change
Reuse application/identity/docs/licence/payment if configured.

### Mobile update
Reuse identity/contact-change/audit.

### Small learner test
- 5–10 synthetic questions;
- persisted attempt;
- server-side scoring;
- bilingual UI;
- no admin/anti-cheat system.

### Legacy PoC
`canonical not found -> synthetic legacy candidate -> reconciliation request -> citizen request status`.

No admin resolution UI.

## 17. Phase 9 — Security and Test Gate

Security is implemented continuously; this phase is the final gate.

Required backend checks:
- no unscoped private resource endpoint;
- CSRF on cookie-auth mutations;
- exact CORS origins;
- rate limits;
- strict DTO validation;
- no stack/secret leakage;
- secure production session cookie;
- migrations clean;
- critical DB constraints/indexes;
- audit/history.

Required frontend checks:
- no auth tokens in local/session storage;
- no authoritative business rules in client;
- no unnecessary private data in URLs;
- localized API reason codes;
- keyboard/focus/reduced motion;
- mobile;
- Hindi complete.

Mandatory automated tests:
1. cross-user authorization;
2. resume;
3. invalid workflow transition;
4. payment duplicate;
5. payment delayed/browser absent;
6. payment tampering;
7. final-slot race;
8. distinct availability reasons;
9. FIFO;
10. offer expiry;
11. identity failure/retry;
12. CSRF;
13. CORS;
14. unexpected DTO fields;
15. sanitized audit;
16. Playwright hero journey English;
17. Playwright hero journey Hindi.

No open P0 correctness/security failure at exit.

## 18. Phase 10 — Deployment and Submission

### Person B
- provision/migrate/seed Neon;
- deploy NestJS to managed Node host;
- configure allowed web origin;
- configure real-domain cookie + CSRF behavior;
- production smoke/security check;
- safe logs;
- demo reset.

### Person A
- deploy Next.js to Vercel;
- configure API URL;
- production CSP/security headers;
- verify cookie auth;
- mobile/browser check;
- full Hindi/English check;
- remove any dev controls;
- final UX polish.

### Shared
- fresh-seed rehearsal;
- one-minute demo;
- one-minute technical explanation;
- 250-word summary;
- architecture diagram;
- “real vs simulated” explanation;
- public-link check;
- submit before 28 Aug 8 p.m. IST.

## 19. Appointment response shape

Month example:

```json
{
  "rtoId": "rto_rohini",
  "month": "2026-08",
  "days": [
    {"date":"2026-08-25","status":"AVAILABLE","availableSlots":3},
    {"date":"2026-08-26","status":"CAPACITY_FULL","availableSlots":0},
    {"date":"2026-08-27","status":"SLOTS_NOT_RELEASED","availableSlots":0}
  ]
}
```

Day example:

```json
[
  {
    "slotId":"slot_0900",
    "startTime":"09:00",
    "endTime":"09:30",
    "capacity":20,
    "remaining":0,
    "status":"CAPACITY_FULL"
  },
  {
    "slotId":"slot_0930",
    "startTime":"09:30",
    "endTime":"10:00",
    "capacity":20,
    "remaining":2,
    "status":"AVAILABLE"
  }
]
```

Frontend display is informational; booking re-checks DB state transactionally.

## 20. Core acceptance scenarios

### AC-01 Resume
Save application -> logout/close -> return -> completed sections + next action remain correct.

### AC-02 Authorization
User B with User A’s ID receives no private data and cannot mutate it.

### AC-03 Payment convergence
Provider succeeds while browser is absent; event delivered twice; payment succeeds and application advances once.

### AC-04 Identity outage
`PROVIDER_UNAVAILABLE` preserves completed application progress and gives retry path.

### AC-05 Availability transparency
UI distinguishes available/full/not released/centre unavailable/booking unavailable.

### AC-06 Last-slot race
Two concurrent eligible requests -> exactly one confirmed booking.

### AC-07 FIFO
Three compatible entries -> earliest compatible receives released slot offer.

### AC-08 Compatibility
Earlier incompatible entry does not block later compatible entry; FIFO remains strict within compatible set.

### AC-09 Offer expiry
Expired offer cannot be accepted and capacity can be reallocated.

### AC-10 Hindi
Same actionable status/reason semantics exist in Hindi, not partially untranslated critical screens.

## 21. Seed/demo plan

Seed:
- at least two applicants;
- several Delhi RTOs;
- available/full/unreleased/unavailable appointment cases;
- partially completed application;
- payment delayed/duplicate scenarios;
- identity-provider-unavailable scenario;
- waitlist/offer scenario;
- current synthetic licence;
- optional synthetic legacy record.

Normal citizen UI must not expose simulation controls.

Provide a deterministic local/demo reset such as:
`pnpm demo:reset`.

## 22. Timeline

### 22 Aug
Foundation + OpenAPI + DB + web shell + bilingual foundation.

### 23 Aug
Auth/session/security + durable application/resume/status.

### 24 Aug
Synthetic documents/identity + payment reliability.

### 25 Aug
RTO calendar/time slots + transactional booking.

### 26 Aug
Waitlist/offers + hero journey.

### 27 Aug
P1 breadth where stable + full security/test gate + deploy early.

### 28 Aug
No risky architecture changes. Fix blockers, fresh-seed demo, video, summary, public-link verification, submit before 8 p.m.

## 23. Scope pressure protocol

Codex has no authority to cut scope.

If behind schedule:
1. report what is complete/failing;
2. explain blocker;
3. propose smallest simplification;
4. identify whether it touches Hindi/security/tests/P0 correctness;
5. ask permission.

Suggested cut order **only if approved**:
1. AI;
2. extra Aceternity/animation;
3. learner-test depth;
4. lower-priority P1 breadth;
5. legacy depth.

Hindi is mandatory.

## 24. Real vs simulated

| Capability | Round 1 |
|---|---|
| Application persistence/resume | Real |
| Workflow/status derivation | Real |
| Session/authorization | Real PoC implementation |
| Fee snapshot | Real synthetic-policy behavior |
| Payment network | Simulated |
| Payment convergence/idempotency | Real |
| OTP/Aadhaar provider | Simulated |
| Identity recovery state | Real |
| RTO/calendar source data | Synthetic |
| Capacity enforcement | Real |
| Booking transaction | Real |
| Waitlist FIFO/offers | Real |
| Licence data | Synthetic |
| Legacy source | Synthetic |
| Legacy request flow | Real if implemented |
| Documents | Synthetic metadata |
| Admin UI | Not built |
| AI | Optional |

## 25. Submission definition of done

- RaahSathi branding and independent-prototype disclosure;
- English + Hindi complete for implemented citizen flows;
- mobile usable;
- secure synthetic login/session;
- owner authorization;
- durable application/resume;
- backend-derived status;
- reliable payment;
- calendar/time capacity;
- transactional booking;
- FIFO waitlist/offer;
- mandatory tests green;
- clean migrations;
- deterministic seed/reset;
- deployed web/API/DB;
- one-minute product demo rehearsed;
- one-minute technical explanation rehearsed;
- summary/live link verified;
- no claim exceeds implementation.
