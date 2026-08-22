# ADR 0001: Consolidate the backend into Next.js Route Handlers

- Status: Accepted
- Date: 23 August 2026

## Decision

RaahSathi will use one Next.js 16 application for the citizen UI and the REST API. Public endpoints remain under `/api/v1`; Route Handlers delegate to server-only services, which own Prisma and PostgreSQL access.

## Rationale

The two-person Round 1 team benefits from one TypeScript application, one deployment, same-origin cookies, shared Zod contracts, and fewer integration surfaces. The REST paths and server-authoritative business rules remain stable.

## Consequences

- The separate API application and its framework dependencies are removed.
- Zod schemas generate OpenAPI 3.1 instead of decorator-based API metadata.
- Separate credentialed CORS is removed; mutation endpoints must enforce CSRF and exact Origin checks.
- Route Handlers may run as serverless functions. They cannot rely on process memory, filesystem persistence, WebSockets, or an always-running scheduler.
- PostgreSQL remains authoritative. Thirty-minute offers use transactionally checked lazy expiry for Round 1.

## Reconsideration triggers

Revisit the transport architecture if the product requires long-running jobs, sustained WebSockets, background processing that cannot fit bounded scheduled invocations, or independently scaling public APIs. Such a change requires explicit approval under `AGENTS.md`.
