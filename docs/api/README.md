# API contract

RaahSathi exposes same-origin Next.js Route Handlers under `/api/v1`.

Strict Zod schemas registered in `apps/web/src/server/openapi` are authoritative. `docs/api/openapi.json` is generated from those schemas and must pass `pnpm openapi:check`.

Implemented endpoints:

- `GET /api/v1/health`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/request-otp`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `GET /api/v1/services`
- `POST /api/v1/applications`
- `GET /api/v1/applications`
- `GET /api/v1/applications/:id`
- `PATCH /api/v1/applications/:id/sections/:sectionKey`
- `POST /api/v1/applications/:id/steps/:sectionKey/complete`

Every endpoint returns or propagates a sanitized `x-request-id`. Public errors use stable codes, localization keys, and correlation IDs without raw exception details.

Authentication uses an opaque HttpOnly session cookie. Authenticated mutations also require exact Origin and a session-bound `x-csrf-token`. The browser never stores an authentication token in local or session storage.
