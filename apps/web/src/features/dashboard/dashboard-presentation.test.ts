import { describe, expect, it } from "vitest";

import { resolveNextActionCard } from "./dashboard-presentation";

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

  it("uses neutral copy for future unrecognized non-actionable states", () => {
    expect(resolveNextActionCard({
      id: "application-id",
      statusCode: "FUTURE_STATE",
      nextActionCode: "NONE",
    }, copy)).toEqual({ description: "nothing to do" });
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
