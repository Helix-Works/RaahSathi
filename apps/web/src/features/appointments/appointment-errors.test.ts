import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/api";
import { appointmentErrorPresentation } from "./appointment-errors";

function error(code: string, status = 409, retryAfterSeconds?: number) {
  return new ApiClientError({ status, code, messageKey: "errors.requestFailed", retryable: status >= 429, retryAfterSeconds });
}

describe("appointment error recovery", () => {
  it.each([
    ["CAPACITY_FULL", "refresh-slots"],
    ["SLOT_ELAPSED", "refresh-slots"],
    ["CENTER_UNAVAILABLE", "refresh-calendar"],
    ["BOOKING_SERVICE_UNAVAILABLE", "refresh-calendar"],
    ["APPOINTMENT_ALREADY_BOOKED", "reconstruct"],
    ["AUTH_SESSION_EXPIRED", "signin"],
    ["CSRF_INVALID", "reload"],
  ] as const)("maps %s to %s", (code, action) => {
    expect(appointmentErrorPresentation(error(code), "en").action).toBe(action);
  });

  it("includes a normalized Retry-After without exposing backend detail", () => {
    const result = appointmentErrorPresentation(error("APPOINTMENT_RATE_LIMITED", 429, 60), "en");
    expect(result).toEqual({ message: "Too many appointment attempts were made. Try again in 60 seconds.", action: "retry" });
  });

  it("uses a safe generic message for unknown errors in both languages", () => {
    expect(appointmentErrorPresentation(new Error("database secret"), "en").message).not.toContain("database secret");
    expect(appointmentErrorPresentation(new Error("database secret"), "hi").message).toContain("प्रगति सुरक्षित");
  });
});
