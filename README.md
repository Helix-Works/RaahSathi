# RaahSathi

RaahSathi is an independent, Delhi-focused hackathon proof of concept for clearer and more reliable browser-based driving-licence service workflows.

This repository uses synthetic data only. It is not an official Government of India or Delhi Government service and must not be used with real personal, licence, payment, or identity data.

## Technology

- Application: Next.js 16, React, TypeScript, and same-origin Route Handlers under `/api/v1`
- UI: Tailwind CSS, shadcn/ui foundation, React Hook Form, and Zod
- Server: server-only TypeScript services, Zod contracts, Prisma, and PostgreSQL on Neon
- Tests: Vitest and Playwright
- Workspace: pnpm workspaces

## Repository layout

```text
apps/web/                 Next.js citizen UI, Route Handlers, and server services
apps/web/prisma/          Prisma schema, migrations, and synthetic seed
apps/web/src/app/api/v1/  Public REST Route Handlers
apps/web/src/server/      Server-only domain, HTTP, database, and contract code
packages/contracts/       Generated or genuinely shared wire-contract artifacts
e2e/                      Cross-application Playwright tests
docs/                     Architecture, API, decision, and demo notes
```

`AGENTS.md` and `PLAN.md` are authoritative. Read both before making changes.

## Prerequisites

- Node.js 22.12.0 or newer
- pnpm 11 (use `corepack pnpm` if the pnpm shim is not installed)
- PostgreSQL when exercising readiness or database-backed features

## Install and configure

```bash
pnpm install
```

Copy `apps/web/.env.example` to `apps/web/.env.local` and use synthetic development database credentials. Never commit secrets.

## Develop

```bash
pnpm dev
```

The UI runs at `http://localhost:3000`. Health is `GET http://localhost:3000/api/v1/health`; readiness is `GET http://localhost:3000/api/v1/health/ready`.

After applying the committed migrations to a local disposable database, run `pnpm --filter @raahsathi/web prisma:seed`. The seed creates the Phase 1 applicants, a resumable synthetic learner application, a recoverable identity-provider scenario, and synthetic learner-licence context. The standard login is `9000000000` / `123456`; `9000000002` demonstrates authentication-provider unavailability. Never enter real personal, document, or licence data.

Phase 2 implements durable learner and permanent-licence application skeletons: create/resume, owner-scoped list/detail, optimistic section saving, ordered idempotent completion, server-derived status/next action, and immutable application history.

Phase 3 adds synthetic document metadata, persisted identity outcomes, safe retry and idempotent verification advancement, and owner-scoped synthetic licence context. No real upload or external identity provider is used.

Phase 4 adds server-calculated synthetic fee snapshots, idempotent payment attempts, signed simulated-provider events, browser-independent delayed convergence, duplicate-event safety, and bilingual payment/recovery presentation. No real payment network or financial data is used.

After the Phase 5/6 migrations, `pnpm --filter @raahsathi/web prisma:seed:phase6-demo` creates the deterministic appointment/waitlist demo accounts. Re-running that command is the supported repair path for the seed-owned Phase 6 fixtures: it preserves durable journey progress and reconciles only the three legacy malformed payment references after exact applicant, application, fee, payment, event, RTO, and slot identity checks. It fails closed if any deterministic identifier contains unexpected data.

## Phase 7 hero journey

Use synthetic account `9000000007` with the configured demo OTP. The deterministic commands are `pnpm demo:reset`, `pnpm demo:stage:permanent`, and `pnpm demo:release-slot`; the production-mode bilingual gate is `pnpm test:e2e:hero`. See the [Phase 7 demo runbook](docs/demo/README.md) for the exact rehearsal, safety confirmation, expected states, and real-versus-simulated boundary.

## Quality checks

```bash
pnpm prisma:generate
pnpm prisma:validate
pnpm openapi:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:db
pnpm build
pnpm test:e2e
```

`pnpm test:db` intentionally fails unless both `TEST_DATABASE_URL` and the explicit disposable-database confirmation from `.env.example` are set. It must never target normal development or production data.

Browser code must never import `apps/web/src/server`. Server Components should call server services directly, while browser clients use same-origin `/api/v1` requests.
