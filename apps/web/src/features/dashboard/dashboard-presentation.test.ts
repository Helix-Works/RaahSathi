import { describe, expect, it } from "vitest";

import type { DashboardApplicationSummary } from "./types";
import { resolveNextActionCard, selectHeroApplication } from "./dashboard-presentation";

const copy = {
  defaultDescription: "default",
  readyForAppointmentDescription: "payment complete",
  appointmentBookedDescription: "appointment booked",
  waitlistedDescription: "waitlisted",
  slotOfferedDescription: "offered",
  noActionDescription: "nothing to do",
  continueLabel: "Continue",
} as const;

describe("dashboard next-action presentation", () => {
  const application = (
    id: string,
    serviceKey: DashboardApplicationSummary["serviceKey"],
    statusCode: DashboardApplicationSummary["statusCode"],
    updatedAt: string,
  ): DashboardApplicationSummary => ({
    id,
    serviceKey,
    statusCode,
    progressPercent: statusCode === "DRAFT" ? 0 : 100,
    nextActionCode: statusCode === "SLOT_OFFERED" ? "REVIEW_OFFER"
      : statusCode === "WAITLISTED" ? "REVIEW_WAITLIST"
        : statusCode === "APPOINTMENT_BOOKED" ? "REVIEW_APPOINTMENT" : "SELECT_APPOINTMENT",
    updatedAt,
  });

  it("selects offered, waitlisted, then unbooked Permanent DL work before recency", () => {
    const latestBooked = application("latest", "LEARNER_LICENCE", "APPOINTMENT_BOOKED", "2026-08-27T12:00:00.000Z");
    const permanent = application("permanent", "PERMANENT_DRIVING_LICENCE", "READY_FOR_APPOINTMENT", "2026-08-27T09:00:00.000Z");
    const waitlisted = application("waitlisted", "LEARNER_LICENCE", "WAITLISTED", "2026-08-27T08:00:00.000Z");
    const offered = application("offered", "LEARNER_LICENCE", "SLOT_OFFERED", "2026-08-27T07:00:00.000Z");
    expect(selectHeroApplication([latestBooked, permanent])?.id).toBe("permanent");
    expect(selectHeroApplication([latestBooked, permanent, waitlisted])?.id).toBe("waitlisted");
    expect(selectHeroApplication([latestBooked, permanent, waitlisted, offered])?.id).toBe("offered");
  });

  it("falls back to other unbooked work and then the latest application", () => {
    const olderBooked = application("older", "LEARNER_LICENCE", "APPOINTMENT_BOOKED", "2026-08-25T09:00:00.000Z");
    const latestBooked = application("latest", "PERMANENT_DRIVING_LICENCE", "APPOINTMENT_BOOKED", "2026-08-27T09:00:00.000Z");
    const draft = application("draft", "LEARNER_LICENCE", "DRAFT", "2026-08-24T09:00:00.000Z");
    expect(selectHeroApplication([olderBooked, latestBooked, draft])?.id).toBe("draft");
    expect(selectHeroApplication([olderBooked, latestBooked])?.id).toBe("latest");
  });
  it("keeps a paid application non-actionable with payment-complete copy", () => {
    expect(resolveNextActionCard({
      id: "application-id",
      statusCode: "READY_FOR_APPOINTMENT",
      nextActionCode: "NONE",
    }, copy)).toEqual({ description: "payment complete" });
  });

  it("links appointment selection to the application booking flow", () => {
    expect(resolveNextActionCard({
      id: "application-id",
      statusCode: "READY_FOR_APPOINTMENT",
      nextActionCode: "SELECT_APPOINTMENT",
    }, copy)).toEqual({
      description: "payment complete",
      actionLabel: "Continue",
      actionHref: "/applications/application-id",
    });
  });

  it("does not reuse payment copy for an already-booked appointment", () => {
    expect(resolveNextActionCard({
      id: "application-id",
      statusCode: "APPOINTMENT_BOOKED",
      nextActionCode: "NONE",
    }, copy)).toEqual({ description: "appointment booked" });
  });

  it("links ordinary actionable states back to the application", () => {
    expect(resolveNextActionCard({
      id: "application-id",
      statusCode: "READY_FOR_PAYMENT",
      nextActionCode: "PAY_FEES",
    }, copy)).toEqual({
      description: "default",
      actionLabel: "Continue",
      actionHref: "/applications/application-id",
    });
  });

  it("sends waitlist and offer actions to the authoritative application view", () => {
    expect(resolveNextActionCard({ id: "application-id", statusCode: "WAITLISTED", nextActionCode: "REVIEW_WAITLIST" }, copy)).toEqual({ description: "waitlisted", actionLabel: "Continue", actionHref: "/applications/application-id" });
    expect(resolveNextActionCard({ id: "application-id", statusCode: "SLOT_OFFERED", nextActionCode: "REVIEW_OFFER" }, copy)).toEqual({ description: "offered", actionLabel: "Continue", actionHref: "/applications/application-id" });
  });
});
