# Phase 7 hero demo runbook

This runbook rehearses RaahSathi's deterministic learner-to-Permanent Driving Licence journey. Every person, licence, payment, identity result, RTO, appointment, and provider event is synthetic. RaahSathi is an independent prototype, not an official government service.

## Account and fixed scenario

- Citizen mobile: `9000000007`
- Capacity-holder mobile: `9000000008` (fixture only; do not log in during the demo)
- OTP: the value of `AUTH_DEMO_OTP` (`123456` in the example environment)
- RTO: Synthetic Rohini Hero RTO
- Offered slot: tomorrow, 09:00–09:30, with a 30-minute acceptance window

The commands require this exact server-only acknowledgement:

```dotenv
RAAHSATHI_DEMO_RESET_CONFIRMATION="RESET_PHASE7_HERO_SYNTHETIC_RECORDS"
```

Keep `NEXT_PUBLIC_DATA_SOURCE="real"`. Configure `DATABASE_URL`, `DIRECT_URL`, authentication peppers, OTP, and payment webhook secret as described in `apps/web/.env.example`. Never use a database containing real citizen data.

## Prepare and start

Apply the committed migrations to the synthetic demo database, then run:

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm demo:reset
pnpm build
pnpm --filter @raahsathi/web start
```

`pnpm demo:reset` deletes and rebuilds only the enumerated Phase 7 fixture records. It fails closed if those stable identifiers collide with records outside the fixture. After reset, `9000000007` has a partial Learner Licence application: Personal Details is complete, Address contains postal code `110085` but is not complete, and there is no learner licence, Permanent DL application, appointment, waitlist, or offer. Authentication sessions, OTP attempts, and rate-limit state for the two fixture accounts are cleared.

Open `http://localhost:3000`, log in with the hero account, and choose English or Hindi. Edit the Address postal code, save it, complete the section, log out, and log in again to demonstrate database-backed reconstruction. Synthetic OTP requests have an intentional one-minute resend cooldown; either wait for it or issue the first OTP at least one minute before recording the renewed-login step.

## Advance the off-screen milestone

While the hero remains logged in, run:

```bash
pnpm demo:stage:permanent
```

Refresh the dashboard. The command idempotently completes the synthetic learner milestones, identity, payment, appointment history, and learner licence; creates a completed Permanent DL application with matching learner context; and leaves the application in the backend-derived `READY_FOR_APPOINTMENT` state. It preserves the active session and preserves the Address data edited by the citizen.

Open the Permanent DL application. Confirm that the learner licence context appears before the editor, select Synthetic Rohini Hero RTO, and show both tomorrow's full slot and the unreleased dates. Join the waitlist for tomorrow morning. Change a preference and verify that the original joined time does not change.

## Release, allocate, and accept

After the hero joins the waitlist, run:

```bash
pnpm demo:release-slot
```

This idempotently cancels the exact synthetic capacity-holder appointment, releases capacity once, and writes sanitized history/audit records. Back in the authenticated citizen UI, choose **Refresh waitlist status**. That existing Route Handler performs strict-FIFO allocation and produces the 30-minute offer; the release command does not manufacture an offer. Accept it, reload the application, then return to the dashboard to show the confirmed appointment reconstructed from PostgreSQL.

All three commands are safe to repeat for their current stage. Use `pnpm demo:reset` to begin a fresh rehearsal.

## Two-minute recording sequence

Before recording, reset and start the production build, log in once, and allow the OTP resend cooldown to elapse.

1. **0:00–0:25:** Show the independent-prototype disclosure, learner dashboard, saved Address, edit/save/complete, then log out and renew the session.
2. **0:25–0:45:** Run `pnpm demo:stage:permanent` off-screen, refresh, and show the dashboard selecting Permanent DL plus the learner licence eligibility context.
3. **0:45–1:15:** Show the full and unreleased appointment states, join tomorrow-morning waitlist, update preferences, and point out the unchanged join time.
4. **1:15–1:40:** Run `pnpm demo:release-slot` off-screen, refresh waitlist status, show the 30-minute offer, and accept it.
5. **1:40–2:00:** Reload, show the reconstructed confirmed appointment on the dashboard, switch language, and show the same critical status in Hindi at mobile width.

For independent automated evidence in both languages, use the hero gate below rather than relying only on the recording.

## Automated bilingual rehearsal

The hero gate always targets a disposable PostgreSQL database distinct from `DATABASE_URL`:

```dotenv
TEST_DATABASE_URL="postgresql://.../raahsathi_test?sslmode=require"
TEST_DATABASE_DISPOSABLE_CONFIRMATION="I_UNDERSTAND_THIS_DATABASE_WILL_BE_MUTATED"
RAAHSATHI_DEMO_RESET_CONFIRMATION="RESET_PHASE7_HERO_SYNTHETIC_RECORDS"
```

```bash
pnpm test:e2e:hero
```

It builds and starts Next.js in production mode, uses the real data source, runs mobile Chromium with one worker, and independently covers English and Hindi. Failure traces, screenshots, and video are retained under the ignored Playwright result/report directories.

## Troubleshooting

- **Confirmation error:** copy the exact `RAAHSATHI_DEMO_RESET_CONFIRMATION` value above into `apps/web/.env.local`.
- **Fixture conflict:** stop. The command found a stable fixture identifier attached to non-fixture data and intentionally refused to mutate it. Inspect the synthetic database; do not weaken the guard.
- **OTP request is temporarily unavailable:** wait until one minute after the prior request. Do not change or bypass the authentication rate limit.
- **No Permanent DL card:** run `pnpm demo:stage:permanent`, refresh the dashboard, and verify the app and command use the same `DATABASE_URL` and authentication peppers.
- **No offer after release:** first confirm the hero joined tomorrow's morning waitlist, then run `pnpm demo:release-slot` and use **Refresh waitlist status** while authenticated.
- **Dates differ:** remove an unintended `RAAHSATHI_DEMO_SEED_DATE`, or set it consistently before reset for a controlled rehearsal date.
- **Hero E2E refuses to start:** supply both database confirmations and ensure `TEST_DATABASE_URL` is not byte-for-byte equal to `DATABASE_URL`.

## Real versus simulated

Real application behavior in this PoC includes PostgreSQL persistence, server-managed sessions, CSRF/origin and ownership checks, backend-derived workflow status, transactional capacity changes, strict-FIFO compatible waitlist allocation, temporary-offer rules, acceptance, and reload/logout reconstruction.

Simulated inputs include the people and mobile numbers, OTP and identity-provider outcomes, payment/provider events, learner licence, Delhi RTO and slot data, and the capacity-holder cancellation. `demo:stage:permanent` compresses off-screen milestones for a short recording; `demo:release-slot` triggers a synthetic cancellation. Neither command is a public endpoint or normal citizen control, and no real government, identity, payment, licence, or personal data is used.
