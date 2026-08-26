import { afterEach, describe, expect, it, vi } from "vitest";

import { bookAppointment, getRtoDaySlots, getRtoMonthAvailability, listAppointments } from "./api";

const appointment = {
  id: "10000000-0000-4000-8000-000000000001",
  applicationId: "20000000-0000-4000-8000-000000000001",
  slotId: "30000000-0000-4000-8000-000000000001",
  serviceKey: "LEARNER_LICENCE" as const,
  status: "CONFIRMED" as const,
  rto: { id: "40000000-0000-4000-8000-000000000001", code: "SYNTHETIC_ROHINI", nameEn: "Synthetic Rohini RTO", nameHi: "कृत्रिम रोहिणी आरटीओ", district: "North Delhi", status: "AVAILABLE" as const },
  date: "2026-08-28", startTime: "10:00", endTime: "10:30",
  bookedAt: "2026-08-26T10:00:00.000Z", cancelledAt: null,
};

describe("appointment frontend API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses encoded authoritative month, date, and service queries", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return Response.json(url.includes("availability")
        ? { rtoId: appointment.rto.id, serviceKey: appointment.serviceKey, month: "2026-08", days: [] }
        : { rtoId: appointment.rto.id, serviceKey: appointment.serviceKey, date: appointment.date, status: "AVAILABLE", slots: [] });
    });
    vi.stubGlobal("fetch", fetchMock);

    await getRtoMonthAvailability(appointment.rto.id, "2026-08", appointment.serviceKey);
    await getRtoDaySlots(appointment.rto.id, appointment.date, appointment.serviceKey);

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("month=2026-08&service=LEARNER_LICENCE");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("date=2026-08-28&service=LEARNER_LICENCE");
  });

  it("posts only the application and selected slot identifiers", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return Response.json(appointment, { status: 201 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await bookAppointment(appointment.applicationId, appointment.slotId);

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      applicationId: appointment.applicationId,
      slotId: appointment.slotId,
    });
  });

  it("reconstructs confirmed appointments and rejects malformed success responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ appointments: [appointment] })));
    await expect(listAppointments()).resolves.toEqual([appointment]);

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ appointments: [{ ...appointment, history: [] }] })));
    await expect(listAppointments()).rejects.toMatchObject({ code: "INVALID_API_RESPONSE" });
  });
});
