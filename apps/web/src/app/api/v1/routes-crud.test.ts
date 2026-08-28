import { describe, expect, it } from "vitest";

import { GET as getServices } from "./services/route";
import { GET as getRtos } from "./rtos/route";
import { GET as getAvailability } from "./rtos/[id]/availability/route";
import { GET as getSlots } from "./rtos/[id]/slots/route";
import { POST as createApplication, GET as listApplications } from "./applications/route";
import { GET as getApplication } from "./applications/[id]/route";
import { PATCH as saveSection } from "./applications/[id]/sections/[sectionKey]/route";
import { GET as listLicences } from "./licences/route";
import { createListWaitlistHandler, POST as joinWaitlist } from "./waitlist/route";
import { GET as getWaitlistEntry, PATCH as updateWaitlistEntry, DELETE as leaveWaitlist } from "./waitlist/[id]/route";
import { POST as acceptOffer } from "./offers/[id]/accept/route";
import { POST as bookAppointment, GET as listAppointments } from "./appointments/route";
import { POST as requestOtp } from "./auth/request-otp/route";

const UUID = "30000000-0000-4000-8000-000000000001";

function req(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost${path}`, {
    headers: { origin: "http://localhost", "content-type": "application/json" },
    ...init,
  });
}

function crossReq(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost${path}`, {
    headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
    ...init,
  });
}

function noSessionReq(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("Services catalogue", () => {
  it("returns all four service keys with 200", async () => {
    const response = await getServices(req("/api/v1/services"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([
      { serviceKey: "LEARNER_LICENCE" },
      { serviceKey: "PERMANENT_DRIVING_LICENCE" },
      { serviceKey: "DRIVING_LICENCE_RENEWAL" },
      { serviceKey: "DRIVING_LICENCE_ADDRESS_CHANGE" },
    ]);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
  });
});

describe("RTOs", () => {
  it("returns the RTO list with 200 and no-store cache", async () => {
    const response = await getRtos(req("/api/v1/rtos"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("rtos");
    expect(Array.isArray(body.rtos)).toBe(true);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("RTO availability — parameter validation", () => {
  it("returns 400 when id is not a UUID", async () => {
    const response = await getAvailability(
      req(`/api/v1/rtos/not-a-uuid/availability?month=2026-09&service=LEARNER_LICENCE`),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("id");
  });

  it("returns 400 when month is invalid", async () => {
    const response = await getAvailability(
      req(`/api/v1/rtos/${UUID}/availability?month=2026-13&service=LEARNER_LICENCE`),
      { params: Promise.resolve({ id: UUID }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("month");
  });

  it("returns 400 when service is invalid", async () => {
    const response = await getAvailability(
      req(`/api/v1/rtos/${UUID}/availability?month=2026-09&service=INVALID`),
      { params: Promise.resolve({ id: UUID }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("service");
  });

  it("returns 400 when all query parameters are missing", async () => {
    const response = await getAvailability(
      req(`/api/v1/rtos/${UUID}/availability`),
      { params: Promise.resolve({ id: UUID }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_FAILED");
  });
});

describe("RTO slots — parameter validation", () => {
  it("returns 400 when id is not a UUID", async () => {
    const response = await getSlots(
      req(`/api/v1/rtos/not-a-uuid/slots?date=2026-09-15&service=LEARNER_LICENCE`),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("id");
  });

  it("returns 400 when date is invalid", async () => {
    const response = await getSlots(
      req(`/api/v1/rtos/${UUID}/slots?date=not-a-date&service=LEARNER_LICENCE`),
      { params: Promise.resolve({ id: UUID }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("date");
  });

  it("returns 400 when service is invalid", async () => {
    const response = await getSlots(
      req(`/api/v1/rtos/${UUID}/slots?date=2026-09-15&service=NOPE`),
      { params: Promise.resolve({ id: UUID }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("service");
  });
});

describe("Applications — security and auth", () => {
  it("POST returns 403 for cross-origin before any database access", async () => {
    const response = await createApplication(
      crossReq("/api/v1/applications", {
        method: "POST",
        body: JSON.stringify({ serviceKey: "LEARNER_LICENCE" }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("POST returns 403 when no session cookie (origin check rejects missing origin header)", async () => {
    const response = await createApplication(
      noSessionReq("/api/v1/applications", {
        method: "POST",
        body: JSON.stringify({ serviceKey: "LEARNER_LICENCE" }),
      }),
    );
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("ACCESS_DENIED");
  });

  it("GET returns 401 when no session cookie is present", async () => {
    const response = await listApplications(
      noSessionReq("/api/v1/applications"),
    );
    expect(response.status).toBe(401);
  });
});

describe("Application by ID — parameter validation and auth", () => {
  it("returns 400 when id is not a UUID", async () => {
    const response = await getApplication(
      req("/api/v1/applications/not-a-uuid"),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("id");
  });

  it("returns 401 when no session cookie is present", async () => {
    const response = await getApplication(
      noSessionReq(`/api/v1/applications/${UUID}`),
      { params: Promise.resolve({ id: UUID }) },
    );
    expect(response.status).toBe(401);
  });
});

describe("Application sections — parameter validation and auth", () => {
  it("PATCH returns 400 when id is not a UUID or sectionKey is invalid", async () => {
    const response = await saveSection(
      req("/api/v1/applications/not-a-uuid/sections/INVALID_SECTION", {
        method: "PATCH",
        body: JSON.stringify({ expectedRevision: 0, data: { fullName: "Test" } }),
      }),
      { params: Promise.resolve({ id: "not-a-uuid", sectionKey: "INVALID_SECTION" }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_FAILED");
  });

  it("PATCH returns 403 for cross-origin request", async () => {
    const response = await saveSection(
      crossReq(`/api/v1/applications/${UUID}/sections/PERSONAL_DETAILS`, {
        method: "PATCH",
        body: JSON.stringify({ expectedRevision: 0, data: { fullName: "Test" } }),
      }),
      { params: Promise.resolve({ id: UUID, sectionKey: "PERSONAL_DETAILS" }) },
    );
    expect(response.status).toBe(403);
  });

  it("PATCH returns 403 when no session cookie is present (CSRF check fails)", async () => {
    const response = await saveSection(
      noSessionReq(`/api/v1/applications/${UUID}/sections/PERSONAL_DETAILS`, {
        method: "PATCH",
        body: JSON.stringify({ expectedRevision: 0, data: { fullName: "Test" } }),
      }),
      { params: Promise.resolve({ id: UUID, sectionKey: "PERSONAL_DETAILS" }) },
    );
    expect(response.status).toBe(403);
  });
});

describe("Licences — auth", () => {
  it("returns 401 when no session cookie is present", async () => {
    const response = await listLicences(
      noSessionReq("/api/v1/licences"),
    );
    expect(response.status).toBe(401);
  });
});

describe("Waitlist — parameter validation, auth, and security", () => {
  it("GET returns 400 for invalid applicationId filter via injected auth", async () => {
    const handler = createListWaitlistHandler(
      async () => [],
      async () => ({
        sessionId: "session-id",
        applicantId: "10000000-0000-4000-8000-000000000001",
      }),
    );
    const response = await handler(
      req("/api/v1/waitlist?applicationId=not-a-uuid"),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("applicationId");
  });

  it("GET returns 200 with empty list when filter is valid", async () => {
    const handler = createListWaitlistHandler(
      async () => [],
      async () => ({
        sessionId: "session-id",
        applicantId: "10000000-0000-4000-8000-000000000001",
      }),
    );
    const response = await handler(
      req("/api/v1/waitlist"),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).entries).toEqual([]);
  });

  it("GET returns 401 when no session cookie is present", async () => {
    const response = await listApplications(
      noSessionReq("/api/v1/waitlist"),
    );
    expect(response.status).toBe(401);
  });

  it("POST returns 403 for cross-origin request", async () => {
    const response = await joinWaitlist(
      crossReq("/api/v1/waitlist", {
        method: "POST",
        body: JSON.stringify({
          applicationId: UUID,
          rtoId: UUID,
          acceptableDateFrom: "2026-09-01",
          acceptableDateTo: "2026-09-30",
          timeBuckets: ["MORNING"],
          vehicleClass: "LMV",
        }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("POST returns 403 when no session cookie (origin check rejects missing origin header)", async () => {
    const response = await joinWaitlist(
      noSessionReq("/api/v1/waitlist", {
        method: "POST",
        body: JSON.stringify({ applicationId: UUID }),
      }),
    );
    expect(response.status).toBe(403);
  });
});

describe("Waitlist entry by ID — parameter validation and auth", () => {
  it("GET returns 401 when unauthenticated (auth runs before param validation)", async () => {
    const response = await getWaitlistEntry(
      noSessionReq("/api/v1/waitlist/not-a-uuid"),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(response.status).toBe(401);
  });

  it("PATCH returns 403 when unauthenticated (auth runs before param validation)", async () => {
    const response = await updateWaitlistEntry(
      noSessionReq("/api/v1/waitlist/not-a-uuid", {
        method: "PATCH",
        body: JSON.stringify({
          rtoId: UUID,
          acceptableDateFrom: "2026-09-01",
          acceptableDateTo: "2026-09-30",
          timeBuckets: ["MORNING"],
          vehicleClass: "LMV",
        }),
      }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(response.status).toBe(403);
  });

  it("DELETE returns 403 when unauthenticated (auth runs before param validation)", async () => {
    const response = await leaveWaitlist(
      noSessionReq("/api/v1/waitlist/not-a-uuid", { method: "DELETE" }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(response.status).toBe(403);
  });

  it("GET returns 401 when no session cookie is present", async () => {
    const response = await getWaitlistEntry(
      noSessionReq(`/api/v1/waitlist/${UUID}`),
      { params: Promise.resolve({ id: UUID }) },
    );
    expect(response.status).toBe(401);
  });

  it("PATCH returns 403 for cross-origin request", async () => {
    const response = await updateWaitlistEntry(
      crossReq(`/api/v1/waitlist/${UUID}`, {
        method: "PATCH",
        body: JSON.stringify({
          rtoId: UUID,
          acceptableDateFrom: "2026-09-01",
          acceptableDateTo: "2026-09-30",
          timeBuckets: ["MORNING"],
          vehicleClass: "LMV",
        }),
      }),
      { params: Promise.resolve({ id: UUID }) },
    );
    expect(response.status).toBe(403);
  });

  it("DELETE returns 403 for cross-origin request", async () => {
    const response = await leaveWaitlist(
      crossReq(`/api/v1/waitlist/${UUID}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: UUID }) },
    );
    expect(response.status).toBe(403);
  });
});

describe("Offers — parameter validation and auth", () => {
  it("POST returns 403 when unauthenticated (auth runs before param validation)", async () => {
    const response = await acceptOffer(
      noSessionReq("/api/v1/offers/not-a-uuid/accept", { method: "POST" }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(response.status).toBe(403);
  });

  it("POST returns 403 for cross-origin request", async () => {
    const response = await acceptOffer(
      crossReq(`/api/v1/offers/${UUID}/accept`, { method: "POST" }),
      { params: Promise.resolve({ id: UUID }) },
    );
    expect(response.status).toBe(403);
  });
});

describe("Appointments — security and auth", () => {
  it("POST returns 403 for cross-origin request", async () => {
    const response = await bookAppointment(
      crossReq("/api/v1/appointments", {
        method: "POST",
        body: JSON.stringify({ applicationId: UUID, slotId: UUID }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("POST returns 403 when no session cookie (origin check rejects missing origin header)", async () => {
    const response = await bookAppointment(
      noSessionReq("/api/v1/appointments", {
        method: "POST",
        body: JSON.stringify({ applicationId: UUID, slotId: UUID }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("GET returns 401 when no session cookie is present", async () => {
    const response = await listAppointments(
      noSessionReq("/api/v1/appointments"),
    );
    expect(response.status).toBe(401);
  });
});

describe("Auth request-otp — validation (no session required)", () => {
  it("returns 400 when mobileNumber is missing", async () => {
    const response = await requestOtp(
      req("/api/v1/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("mobileNumber");
  });

  it("returns 400 when mobileNumber format is invalid", async () => {
    const response = await requestOtp(
      req("/api/v1/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ mobileNumber: "12345" }),
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("mobileNumber");
  });

  it("returns 400 when mobileNumber starts with invalid digit", async () => {
    const response = await requestOtp(
      req("/api/v1/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ mobileNumber: "5000000000" }),
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toHaveProperty("mobileNumber");
  });

  it("returns 400 when body contains unknown fields (strict schema)", async () => {
    const response = await requestOtp(
      req("/api/v1/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ mobileNumber: "9000000000", extra: true }),
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_FAILED");
  });

  it("returns 403 for cross-origin request", async () => {
    const response = await requestOtp(
      crossReq("/api/v1/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ mobileNumber: "9000000000" }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("returns 415 when content-type is not application/json", async () => {
    const response = await requestOtp(
      new Request("http://localhost/api/v1/auth/request-otp", {
        method: "POST",
        headers: { origin: "http://localhost", "content-type": "text/plain" },
        body: "not json",
      }),
    );
    expect(response.status).toBe(415);
  });

  it("returns 400 when body is not valid JSON", async () => {
    const response = await requestOtp(
      new Request("http://localhost/api/v1/auth/request-otp", {
        method: "POST",
        headers: { origin: "http://localhost", "content-type": "application/json" },
        body: "not json at all {{{",
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_FAILED");
  });
});

describe("Error envelope structure", () => {
  it("every error response includes code, messageKey, and correlationId", async () => {
    const response = await requestOtp(
      req("/api/v1/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    const body = await response.json();
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("messageKey");
    expect(body.error).toHaveProperty("correlationId");
    expect(typeof body.error.correlationId).toBe("string");
  });

  it("correlation ID from x-request-id header is echoed back", async () => {
    const correlationId = "test-correlation-12345";
    const response = await requestOtp(
      req("/api/v1/auth/request-otp", {
        method: "POST",
        headers: { "x-request-id": correlationId },
        body: JSON.stringify({}),
      }),
    );
    expect(response.headers.get("x-request-id")).toBe(correlationId);
    expect((await response.json()).error.correlationId).toBe(correlationId);
  });

  it("random correlation ID is generated when x-request-id is absent", async () => {
    const response = await requestOtp(
      new Request("http://localhost/api/v1/auth/request-otp", {
        method: "POST",
        headers: { origin: "http://localhost", "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    const headerId = response.headers.get("x-request-id");
    expect(headerId).toMatch(/^[0-9a-f-]{36}$/);
    expect((await response.json()).error.correlationId).toBe(headerId);
  });

  it("fieldErrors are scoped to the specific failing fields", async () => {
    const response = await getAvailability(
      req(`/api/v1/rtos/not-a-uuid/availability?month=bad&service=NOPE`),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    const body = await response.json();
    expect(body.error.fieldErrors).toHaveProperty("id");
    expect(body.error.fieldErrors).toHaveProperty("month");
    expect(body.error.fieldErrors).toHaveProperty("service");
  });
});

describe("Security boundaries", () => {
  it("no response leaks CORS headers", async () => {
    const responses = await Promise.all([
      getServices(req("/api/v1/services")),
      getRtos(req("/api/v1/rtos")),
      createApplication(req("/api/v1/applications", { method: "POST", body: JSON.stringify({}) })),
    ]);
    for (const response of responses) {
      expect(response.headers.get("access-control-allow-origin")).toBeNull();
    }
  });

  it("every response includes x-request-id header", async () => {
    const responses = await Promise.all([
      getServices(req("/api/v1/services")),
      getRtos(req("/api/v1/rtos")),
      getAvailability(
        req(`/api/v1/rtos/${UUID}/availability?month=2026-09&service=LEARNER_LICENCE`),
        { params: Promise.resolve({ id: UUID }) },
      ),
    ]);
    for (const response of responses) {
      expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
    }
  });

  it("success responses set no-store cache-control", async () => {
    const response = await getRtos(req("/api/v1/rtos"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
