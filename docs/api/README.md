# API contract

RaahSathi exposes same-origin Next.js Route Handlers under `/api/v1`.

Strict Zod schemas registered in `apps/web/src/server/openapi` are authoritative. `docs/api/openapi.json` is generated from those schemas and must pass `pnpm openapi:check`.

Implemented foundation endpoints:

- `GET /api/v1/health`
- `GET /api/v1/health/ready`

Every endpoint returns or propagates a sanitized `x-request-id`. Public errors use stable codes, localization keys, and correlation IDs without raw exception details.
