import type { Appointment } from "@raahsathi/contracts/appointments";
import { describe, expect, it } from "vitest";

import { beginAppointmentOperation, confirmedAppointmentForApplication, isActiveAppointmentRequest, isBookedReconstructionLoading, selectDate, selectMonth, selectRto, selectSlot } from "./appointment-flow";

describe("appointment selection and reconstruction", () => {
  it("clears stale downstream choices when the RTO, month, or date changes", () => {
    const selected = { month: "2026-08", rtoId: "rto-a", date: "2026-08-28", slotId: "slot-a" };
    expect(selectRto(selected, "rto-b")).toEqual({ month: "2026-08", rtoId: "rto-b" });
    expect(selectMonth(selected, "2026-09")).toEqual({ month: "2026-09", rtoId: "rto-a" });
    expect(selectDate(selected, "2026-08-29")).toEqual({ month: "2026-08", rtoId: "rto-a", date: "2026-08-29" });
    expect(selectSlot(selectDate(selected, "2026-08-29"), "slot-b").slotId).toBe("slot-b");
  });

  it("prevents duplicate submission while a booking operation owns the lock", () => {
    const lock = { current: false };
    expect(beginAppointmentOperation(lock)).toBe(true);
    expect(beginAppointmentOperation(lock)).toBe(false);
  });

  it("rejects stale or aborted appointment requests before they update UI state", () => {
    const first = new AbortController();
    const second = new AbortController();
    expect(isActiveAppointmentRequest(first, first)).toBe(true);
    first.abort();
    expect(isActiveAppointmentRequest(first, first)).toBe(false);
    expect(isActiveAppointmentRequest(second, first)).toBe(false);
    expect(isActiveAppointmentRequest(undefined, second)).toBe(false);
  });

  it("shows the booked reconstruction spinner only while reconstruction is active", () => {
    expect(isBookedReconstructionLoading("APPOINTMENT_BOOKED", "reconstruct")).toBe(true);
    expect(isBookedReconstructionLoading("APPOINTMENT_BOOKED", undefined)).toBe(false);
    expect(isBookedReconstructionLoading("READY_FOR_APPOINTMENT", "reconstruct")).toBe(false);
  });

  it("selects only a confirmed appointment owned by the application", () => {
    const records = [
      { applicationId: "application-a", status: "CANCELLED" },
      { applicationId: "application-b", status: "CONFIRMED" },
      { applicationId: "application-a", status: "CONFIRMED", id: "winner" },
    ] as unknown as readonly Appointment[];
    expect(confirmedAppointmentForApplication(records, "application-a")?.id).toBe("winner");
    expect(confirmedAppointmentForApplication(records, "application-c")).toBeUndefined();
  });
});
