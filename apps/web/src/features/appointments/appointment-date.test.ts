import { describe, expect, it } from "vitest";

import { currentDelhiDate, currentDelhiMonth, formatAppointmentDate, shiftMonth } from "./appointment-date";

describe("appointment Delhi date handling", () => {
  it("derives the Delhi date and month across a UTC day boundary", () => {
    const now = new Date("2026-08-26T19:00:00.000Z");
    expect(currentDelhiDate(now)).toBe("2026-08-27");
    expect(currentDelhiMonth(now)).toBe("2026-08");
  });

  it("moves between months without browser timezone drift", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    const formatted = formatAppointmentDate("2026-08-01", "en");
    expect(formatted).toContain("1 Aug");
    expect(formatted).toContain("2026");
  });
});
