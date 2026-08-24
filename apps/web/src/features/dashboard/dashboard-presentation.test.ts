import { describe, expect, it } from "vitest";

import { resolveNextActionCard } from "./dashboard-presentation";

const copy = {
  defaultDescription: "default",
  readyForAppointmentDescription: "payment complete",
  appointmentBookedDescription: "appointment booked",
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
});
