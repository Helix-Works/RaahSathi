# Route Handler contract wave 1

Status: coordination contract for authentication and durable-application work.

Strict Zod schemas registered by Person B are authoritative. `docs/api/openapi.json` becomes a runtime guarantee only when its Route Handler and server use case are implemented and tested.

## Ownership

- Person B owns Route Handlers, server services, Zod schemas, OpenAPI generation, Prisma, and correction of runtime/document drift.
- Person A consumes generated types and maps stable `messageKey` values into complete English and Hindi presentation.
- UI code never imports Prisma or server-only modules.

## Shared error envelope

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "messageKey": "errors.validationFailed",
    "correlationId": "request-id"
  }
}
```

The UI must not display raw exceptions. Every citizen-visible code requires English and Hindi presentation.

## Implemented routes

```text
GET /api/v1/health
GET /api/v1/health/ready
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
```

Application mutations use optimistic `expectedRevision` values for safe multi-page draft editing. Completion is ordered and idempotent. Responses derive `statusCode`, `progressPercent`, `nextActionCode`, and `blockingReasonCode` on the server and include immutable history events.

Mutation schemas are strict. Cookies are same-origin, opaque, HttpOnly, and server managed. Cookie-authenticated mutations require a session-bound CSRF token and exact Origin validation. Ownership filtering occurs in server services and database queries, never in client code.
