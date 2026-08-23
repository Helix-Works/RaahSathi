# Phase 2 durable applications

Phase 2 persists learner and permanent driving-licence application progress in PostgreSQL. It does not implement documents, identity, payment, appointments, or licence issuance.

## Workflow

```text
choose service
→ create or resume the applicant's application
→ save PERSONAL_DETAILS draft
→ complete saved section
→ ADDRESS
→ SERVICE_DETAILS
→ DECLARATION
→ READY_FOR_IDENTITY
```

Draft saving and step completion are separate mutations. Sections use monotonically increasing revisions; a stale `expectedRevision` returns `APPLICATION_REVISION_CONFLICT` instead of overwriting another page. Completion requires a valid saved section and all preceding sections. Repeating a completed step is harmless and does not append another completion event.

## Authority and ownership

The browser never submits status, progress, next action, or ownership. Server services derive presentation from completed PostgreSQL sections. Every private read and mutation resolves the authenticated applicant, includes ownership in the database predicate, and rechecks consequential state inside the transaction. Cross-applicant identifiers return `RESOURCE_NOT_FOUND` without loading or revealing application data.

## History and recovery

`ApplicationEvent` is append-only application history for creation, saves, completions, and workflow advancement. Server Components read services directly; browser mutations use same-origin `/api/v1` handlers with the Phase 1 session, exact Origin, and session-bound CSRF controls. Refresh, logout, and a new server process reconstruct the journey from PostgreSQL without replaying a mutation.

## Synthetic seed

The standard applicant has one deterministic learner application with `PERSONAL_DETAILS` completed. It demonstrates resume after login. All values are synthetic; real personal or licence data must not be entered.

## Verification

Run Prisma generation/validation, OpenAPI drift, lint, typecheck, Vitest, build, and Playwright. PostgreSQL integration tests require a disposable database distinct from `DATABASE_URL` plus the exact destructive-test acknowledgement. No production migration or reset is part of Phase 2 development.
