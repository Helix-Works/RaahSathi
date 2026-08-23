# Architecture notes

RaahSathi is a pnpm-workspace modular monolith deployed as one Next.js application. The browser uses same-origin Route Handlers under `/api/v1`; thin handlers call server-only services, which exclusively own Prisma and PostgreSQL access.

```text
Browser → Next.js UI/Route Handlers → server-only services → Prisma → Neon PostgreSQL
```

Route Handlers use the Node.js runtime and may execute as bounded serverless invocations. Durable state cannot depend on process memory or the local filesystem. PostgreSQL transactions and constraints remain authoritative for workflows, payments, appointments, waitlists, offers, and audit history.

- [Phase 1 authentication](./phase-1-authentication.md)
- [Phase 2 durable applications](./phase-2-durable-applications.md)
