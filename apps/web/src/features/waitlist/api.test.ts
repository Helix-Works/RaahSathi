import { afterEach, describe, expect, it, vi } from "vitest";

import { acceptOffer, joinWaitlist, listWaitlist, processWaitlistState } from "./api";

const ids = {
  application: "20000000-0000-4000-8000-000000000001",
  entry: "10000000-0000-4000-8000-000000000001",
  offer: "30000000-0000-4000-8000-000000000001",
  rto: "40000000-0000-4000-8000-000000000001",
  slot: "50000000-0000-4000-8000-000000000001",
};
const entry = {
  id: ids.entry, applicationId: ids.application, serviceKey: "LEARNER_LICENCE", status: "ACTIVE", vehicleClass: "LMV",
  acceptableDateFrom: "2026-08-28", acceptableDateTo: "2026-08-30", timeBuckets: ["MORNING"], joinedAt: "2026-08-27T10:00:00.000Z",
  rto: { id: ids.rto, code: "SYNTHETIC_ROHINI", nameEn: "Synthetic Rohini RTO", nameHi: "कृत्रिम रोहिणी आरटीओ", district: "North Delhi", status: "AVAILABLE" }, offer: null,
} as const;
const appointment = { id: "60000000-0000-4000-8000-000000000001", applicationId: ids.application, slotId: ids.slot, serviceKey: "LEARNER_LICENCE", status: "CONFIRMED", rto: entry.rto, date: "2026-08-28", startTime: "09:00", endTime: "09:30", bookedAt: "2026-08-27T10:01:00.000Z", cancelledAt: null } as const;

describe("waitlist frontend API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts only the contract-defined join preferences", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => { void input; void init; return Response.json(entry, { status: 201 }); });
    vi.stubGlobal("fetch", fetchMock);
    await joinWaitlist({ applicationId: ids.application, rtoId: ids.rto, acceptableDateFrom: entry.acceptableDateFrom, acceptableDateTo: entry.acceptableDateTo, timeBuckets: ["MORNING"], vehicleClass: "LMV" });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ applicationId: ids.application, rtoId: ids.rto, acceptableDateFrom: entry.acceptableDateFrom, acceptableDateTo: entry.acceptableDateTo, timeBuckets: ["MORNING"], vehicleClass: "LMV" });
  });

  it("keeps GET observational and processes before a separate authoritative read", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => { void init; return String(input).includes("/process") ? new Response(null, { status: 204 }) : Response.json({ entries: [entry] }); });
    vi.stubGlobal("fetch", fetchMock);
    await processWaitlistState(ids.application);
    await expect(listWaitlist(ids.application)).resolves.toEqual([entry]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/waitlist/process");
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("POST");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(`applicationId=${ids.application}`);
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBeUndefined();
  });

  it("validates the authoritative appointment returned by offer acceptance", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(appointment)));
    await expect(acceptOffer(ids.offer)).resolves.toEqual(appointment);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ...appointment, secret: "no" })));
    await expect(acceptOffer(ids.offer)).rejects.toMatchObject({ code: "INVALID_API_RESPONSE" });
  });
});
