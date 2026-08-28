import { paymentAttemptSchema } from "@raahsathi/contracts/payments";
import { describe, expect, it } from "vitest";

import {
  assertPhase7HeroConfirmation,
  phase7HeroApplicants,
  phase7HeroApplications,
  phase7HeroConfirmation,
  phase7HeroFixtureId,
  phase7HeroPayments,
  phase7HeroSchedule,
  phase7HeroSeedNow,
} from "./phase7-hero-seed";

describe("Phase 7 hero fixture definitions", () => {
  it("keeps generated record IDs in a Phase 7-only ordinal namespace", () => {
    expect(phase7HeroFixtureId("31000000", 61)).toBe("31000000-0000-4000-8000-000000007061");
  });

  it("uses stable application ownership and contract-valid payment references", () => {
    expect(phase7HeroApplications.learner.applicantId).toBe(phase7HeroApplications.permanent.applicantId);
    expect(phase7HeroApplications.holder.applicantId).not.toBe(phase7HeroApplications.learner.applicantId);

    for (const payment of Object.values(phase7HeroPayments)) {
      expect(() => paymentAttemptSchema.parse({
        id: payment.paymentAttemptId,
        status: "SUCCEEDED",
        attemptNumber: 1,
        providerReference: payment.providerReference,
        createdAt: "2026-08-27T10:00:00.000Z",
        updatedAt: "2026-08-27T10:00:00.000Z",
        succeededAt: "2026-08-27T10:00:00.000Z",
      })).not.toThrow();
    }
  });

  it("reserves an untouched fictional citizen account", () => {
    expect(phase7HeroApplicants.fresh).toMatchObject({
      mobile: "9000000009",
      name: "Aarav Mehta",
    });
  });

  it("derives the full and unreleased dates deterministically", () => {
    const schedule = phase7HeroSchedule(new Date("2026-08-27T20:00:00.000Z"));
    expect(schedule.fullDate.toISOString()).toBe("2026-08-28T00:00:00.000Z");
    expect(schedule.unreleasedDate.toISOString()).toBe("2026-08-29T00:00:00.000Z");
  });

  it("anchors every demo command to the validated seed date while preserving its clock", () => {
    const fallback = new Date("2026-08-27T20:15:30.125Z");
    expect(phase7HeroSeedNow("2026-08-25", fallback).toISOString()).toBe("2026-08-25T20:15:30.125Z");
    expect(phase7HeroSeedNow(undefined, fallback)).toBe(fallback);
    expect(() => phase7HeroSeedNow("2026-02-30", fallback)).toThrow(/real calendar date/);
    expect(() => phase7HeroSeedNow("27-08-2026", fallback)).toThrow(/YYYY-MM-DD/);
  });

  it("fails closed without the explicit reset confirmation", () => {
    expect(() => assertPhase7HeroConfirmation(undefined)).toThrow(/RAAHSATHI_DEMO_RESET_CONFIRMATION/);
    expect(() => assertPhase7HeroConfirmation("wrong")).toThrow(/RAAHSATHI_DEMO_RESET_CONFIRMATION/);
    expect(() => assertPhase7HeroConfirmation(phase7HeroConfirmation)).not.toThrow();
  });
});
