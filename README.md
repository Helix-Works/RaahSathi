# RaahSathi

RaahSathi is an independent, Delhi-focused hackathon proof of concept for clearer and more reliable browser-based driving-licence service workflows.

This repository uses synthetic data only. It is not an official Government of India or Delhi Government service and must not be used with real personal, licence, payment, or identity data.

## Technology

- Web: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui foundation, React Hook Form, and Zod
- API: NestJS, TypeScript, REST under `/api/v1`, Swagger/OpenAPI, Prisma, and PostgreSQL
- Tests: Jest/Supertest and Playwright
- Workspace: pnpm workspaces

## Repository layout

```text
apps/web/           Next.js citizen-facing application
apps/api/           NestJS API and server-only Prisma code
packages/contracts/ Minimal shared wire-contract package
e2e/                Cross-application Playwright tests
docs/               Architecture, API, decision, and demo notes
```

`AGENTS.md` and `PLAN.md` are the authoritative project instructions. Read both before making changes; do not edit them without explicit approval.

## Prerequisites

- Node.js 22 or newer
- pnpm 11
- PostgreSQL only when database-backed features are introduced in a later phase

## Install

```bash
pnpm install
```

Copy the relevant `.env.example` files to local, ignored environment files when configuration is needed. Never commit secrets.

## Develop

```bash
pnpm dev:web     # web at http://localhost:3000
pnpm dev:api     # API at http://localhost:3001/api/v1
pnpm dev         # both applications
```

In development, Swagger UI is available at `http://localhost:3001/api/docs`. The health endpoint is `GET http://localhost:3001/api/v1/health`.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Frontend work belongs in `apps/web`, backend and database work in `apps/api`, and only genuinely shared API contracts belong in `packages/contracts`.
