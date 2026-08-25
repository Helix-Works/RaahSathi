# Phase 5 — RTO calendar and appointment booking

Phase 5 is an additive backend slice inside the existing Next.js Route Handler, Prisma, and PostgreSQL boundary.

## Public reads

- `GET /api/v1/rtos`
- `GET /api/v1/rtos/:id/availability?month=YYYY-MM&service=...`
- `GET /api/v1/rtos/:id/slots?date=YYYY-MM-DD&service=...`

Availability is derived from persisted RTO dependency state, slot release time, scheduled start, capacity, and booked count. Slot dates and times are interpreted in Delhi's `Asia/Kolkata` offset; elapsed slots are never bookable. Responses preserve the distinct reason codes `AVAILABLE`, `CAPACITY_FULL`, `SLOTS_NOT_RELEASED`, `SLOT_ELAPSED`, `CENTER_UNAVAILABLE`, and `BOOKING_SERVICE_UNAVAILABLE`.

## Owner-scoped mutations

- `POST /api/v1/appointments`
- `GET /api/v1/appointments`
- `POST /api/v1/appointments/:id/cancel`

Booking requires an owner-scoped application with a converged successful payment. Mutations require the existing session, exact-origin, and CSRF controls. A PostgreSQL-backed per-minute counter bounds booking and cancellation attempts.

## Capacity invariant

Booking locks the application and selected slot in a serializable transaction, takes a shared lock while reading the RTO dependency state, then atomically increments `bookedCount` only while it remains below `capacity`. Unrelated slots at one RTO therefore do not share an exclusive center-wide lock. The same transaction persists the appointment, application status, immutable application event, and sanitized audit event. Cancellation locks the same durable state and decrements capacity exactly once.

The synthetic appointment seed derives released slots from the current Delhi calendar date so a fresh seed remains demonstrable. Set `RAAHSATHI_DEMO_SEED_DATE=YYYY-MM-DD` to pin that seed clock for repeatable recordings or tests. Rerunning the reusable seed restores unreferenced fixture slots, but preserves the schedule of any slot with appointment history and reconciles its `bookedCount` from confirmed appointments so seed execution cannot corrupt live capacity or historical dates.

The disposable-database race test creates one remaining place and issues two concurrent bookings. Exactly one may succeed. Run it only with a separately identified test database and the repository's explicit disposable-database confirmation variables.
