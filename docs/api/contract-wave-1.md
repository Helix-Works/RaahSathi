# Contract Wave 1

Status: coordination proposal for Frontend 0–3 and Backend Phases 1–2. NestJS OpenAPI is the authoritative wire contract. The shapes below are not implemented endpoints and must not be treated as runtime API guarantees until their DTOs and operations appear in `openapi.json`.

## Ownership and workflow

- Person B owns NestJS DTOs, OpenAPI generation, and correction of runtime/document drift.
- Person A may build deterministic fixtures from an agreed wave, then replaces them with the real adapter after the operation appears in OpenAPI.
- `packages/contracts` may later contain generated output only; it must not become a separately hand-maintained source of truth.
- Phase 0 commits OpenAPI JSON. Selecting and installing a TypeScript generator is a later permission-gated coordination decision.

```text
approved behavior
        ↓
minimal DTO and OpenAPI shape
        ↓
frontend fixture
        ↓
backend implementation
        ↓
OpenAPI regeneration
        ↓
frontend real adapter
        ↓
integration verification
```

## Implemented Phase 0 contract

### `ApiError`

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "messageKey": "errors.resourceNotFound",
    "correlationId": "demo-request-404"
  }
}
```

The frontend translates `messageKey`; it must not display raw backend exceptions. Whether validation errors later include a structured `fieldErrors` member remains undecided.

## Proposed Phase 1 authentication shapes

- `CurrentUser`: synthetic applicant identifier, masked mobile display, preferred locale.
- `SessionSummary`: authenticated state and server-provided idle/absolute expiry timestamps.

Exact field names are frozen with Person A before Phase 1 fixture implementation. Raw OTPs, session tokens, CSRF secrets, hashes, and real personal data are never response fields.

## Proposed Phase 2 application shapes

- `ServiceSummary`: stable service code, localized label key, availability state.
- `ApplicationSummary`: identifier, service code, derived status/progress, next-action code, blocking-reason code, updated timestamp.
- `ApplicationDetail`: summary plus sections and compact accepted-transition history.
- `ApplicationSection`: stable section key, separately persisted draft data, completion state, updated timestamp.

The browser never supplies authoritative application status, progress, next action, or blocking reason.

## Catalogues to agree before implementation

- LL and Permanent DL service and section keys.
- Application status and section-completion states.
- Next-action codes.
- Blocking-reason codes.
- Stable `ApiError.error.code` values.
- UTC timestamp serialization and `Asia/Kolkata` display ownership.

Every citizen-visible code must support both English and Hindi presentation. Backend responses provide stable codes and message keys, not translated prose.

## Deferred decisions

- Exact `ApiError.fieldErrors` representation.
- OpenAPI TypeScript generator and committed generated-file policy.
- Final app/API domain topology and resulting cookie/CSRF attributes.
- Exact LL/Permanent section DTOs.
