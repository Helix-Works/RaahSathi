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

- Node.js 22 or newer
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

After applying the committed migrations to a local disposable database, seed the synthetic Phase 1 applicants with `pnpm --filter @raahsathi/web prisma:seed`. The standard login is `9000000000` / `123456`; `9000000002` demonstrates provider unavailability. Never enter a real mobile number.

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

Browser code must never import `apps/web/src/server`. Server Components should call server services directly, while browser clients use same-origin `/api/v1` requests.
