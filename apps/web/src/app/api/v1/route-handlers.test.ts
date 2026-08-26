import { describe, expect, it, vi } from "vitest";

import { GET as getUnknown } from "./[...path]/route";
import { GET as getHealth } from "./health/route";
import { createReadinessHandler } from "./health/ready/route";
import { createRequestOtpHandler, POST as requestOtp } from "./auth/request-otp/route";
import { createVerifyOtpHandler } from "./auth/verify-otp/route";
import { createMeHandler } from "./me/route";
import { GET as getServices } from "./services/route";
import { POST as createApplication } from "./applications/route";
import { POST as startIdentity } from "./applications/[id]/identity-attempts/route";
import { POST as retryIdentity } from "./applications/[id]/identity-attempts/[attemptId]/retry/route";
import { POST as startPayment } from "./applications/[id]/payments/route";
import { createPaymentProviderEventHandler } from "./payment-provider/events/route";
import { POST as bookAppointment } from "./appointments/route";
import { GET as getAvailability } from "./rtos/[id]/availability/route";
import { createListWaitlistHandler } from "./waitlist/route";
import { createProcessWaitlistHandler } from "./waitlist/process/route";
import { apiErrors } from "@/server/http/api-error";

describe("Route Handlers", () => {
  it("serves health with a correlation ID and no permissive CORS", async () => {
    const response = await getHealth(new Request("http://localhost/api/v1/health", { headers: { origin: "https://attacker.invalid" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("reports database readiness and sanitizes failures", async () => {
    const ready = await createReadinessHandler(async () => undefined)(new Request("http://localhost/api/v1/health/ready"));
    expect(await ready.json()).toEqual({ status: "ready", database: "up" });

    const originalError = console.error;
    console.error = () => undefined;
    try {
      const unavailable = await createReadinessHandler(async () => { throw new Error("password=secret"); })(new Request("http://localhost/api/v1/health/ready", { headers: { "x-request-id": "ready-failure" } }));
      expect(unavailable.status).toBe(503);
      expect(JSON.stringify(await unavailable.json())).not.toContain("secret");
    } finally {
      console.error = originalError;
    }
  });

  it("returns the standard envelope for unknown API paths", async () => {
    const response = await getUnknown(new Request("http://localhost/api/v1/missing", { headers: { "x-request-id": "missing-route" } }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "RESOURCE_NOT_FOUND", messageKey: "errors.resourceNotFound", correlationId: "missing-route" } });
  });

  it("serves the Phase 2 catalogue and blocks cross-origin application creation before database access", async () => {
    const services = await getServices(new Request("http://localhost/api/v1/services"));
    expect(services.status).toBe(200);
    expect(await services.json()).toEqual([
      { serviceKey: "LEARNER_LICENCE" }, { serviceKey: "PERMANENT_DRIVING_LICENCE" },
    ]);
    const rejected = await createApplication(new Request("http://localhost/api/v1/applications", {
      method: "POST", headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
      body: JSON.stringify({ serviceKey: "LEARNER_LICENCE" }),
    }));
    expect(rejected.status).toBe(403);
  });

  it("blocks cross-origin identity mutations before database access", async () => {
    const response = await startIdentity(new Request("http://localhost/api/v1/applications/30000000-0000-4000-8000-000000000001/identity-attempts", {
      method: "POST", headers: { origin: "https://attacker.invalid" },
    }), { params: Promise.resolve({ id: "30000000-0000-4000-8000-000000000001" }) });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "ACCESS_DENIED" } });
  });

  it("reports each malformed identity retry path parameter", async () => {
    const response = await retryIdentity(new Request("http://localhost/api/v1/applications/not-an-id/identity-attempts/not-an-attempt/retry", {
      method: "POST",
    }), { params: Promise.resolve({ id: "not-an-id", attemptId: "not-an-attempt" }) });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { fieldErrors: {
      id: ["invalid_format"],
      attemptId: ["invalid_format"],
    } } });
  });

  it("blocks cross-origin payment creation before database access", async () => {
    const response = await startPayment(new Request("http://localhost/api/v1/applications/30000000-0000-4000-8000-000000000001/payments", {
      method: "POST",
      headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
      body: JSON.stringify({ idempotencyKey: "40000000-0000-4000-8000-000000000001" }),
    }), { params: Promise.resolve({ id: "30000000-0000-4000-8000-000000000001" }) });
    expect(response.status).toBe(403);
  });

  it("validates appointment queries and blocks cross-origin booking before database access", async () => {
    const invalidQuery = await getAvailability(new Request("http://localhost/api/v1/rtos/not-an-id/availability?month=2026-13&service=INVALID"), {
      params: Promise.resolve({ id: "not-an-id" }),
    });
    expect(invalidQuery.status).toBe(400);
    expect(await invalidQuery.json()).toMatchObject({ error: { fieldErrors: {
      id: ["invalid_format"],
      month: ["invalid_format"],
      service: ["invalid_value"],
    } } });

    const rejected = await bookAppointment(new Request("http://localhost/api/v1/appointments", {
      method: "POST",
      headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
      body: JSON.stringify({ applicationId: crypto.randomUUID(), slotId: crypto.randomUUID() }),
    }));
    expect(rejected.status).toBe(403);
    expect(await rejected.json()).toMatchObject({ error: { code: "ACCESS_DENIED" } });
  });

  it("returns canonical field errors for malformed waitlist filters", async () => {
    const handler = createListWaitlistHandler(
      async () => [],
      async () => ({ sessionId: crypto.randomUUID(), applicantId: crypto.randomUUID() }),
    );
    const response = await handler(new Request("http://localhost/api/v1/waitlist?applicationId=not-an-id", {
      headers: { "x-request-id": "waitlist-invalid-filter" },
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: {
      code: "VALIDATION_FAILED",
      messageKey: "errors.validationFailed",
      correlationId: "waitlist-invalid-filter",
      fieldErrors: { applicationId: ["invalid_format"] },
    } });
  });

  it("protects explicit waitlist processing with authentication, origin, and CSRF", async () => {
    const applicationId = crypto.randomUUID();
    const applicantId = crypto.randomUUID();
    const processState = vi.fn(async () => undefined);
    const authenticated = async () => ({
      kind: "authenticated" as const,
      context: { sessionId: crypto.randomUUID(), applicantId },
      user: { id: applicantId, displayName: "Synthetic Citizen", preferredLocale: "en" as const },
      csrfSecretHash: "synthetic-hash",
    });
    const accepted = createProcessWaitlistHandler(processState, authenticated);
    const acceptedResponse = await accepted(new Request("http://localhost/api/v1/waitlist/process", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ applicationId }),
    }));
    expect(acceptedResponse.status).toBe(204);
    expect(processState).toHaveBeenCalledWith(
      expect.objectContaining({ applicantId }),
      expect.objectContaining({ applicationId }),
    );

    const csrfRejected = createProcessWaitlistHandler(processState, async () => { throw apiErrors.csrfInvalid(); });
    const csrfResponse = await csrfRejected(new Request("http://localhost/api/v1/waitlist/process", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ applicationId }),
    }));
    expect(csrfResponse.status).toBe(403);
    expect(await csrfResponse.json()).toMatchObject({ error: { code: "CSRF_INVALID" } });

    const realHandler = createProcessWaitlistHandler();
    const crossOrigin = await realHandler(new Request("http://localhost/api/v1/waitlist/process", {
      method: "POST",
      headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
      body: JSON.stringify({ applicationId }),
    }));
    expect(crossOrigin.status).toBe(403);
    const unauthenticated = await realHandler(new Request("http://localhost/api/v1/waitlist/process", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ applicationId }),
    }));
    expect(unauthenticated.status).toBe(401);
  });

  it("validates and transports synthetic provider events through the registered contract", async () => {
    const applicationId = "30000000-0000-4000-8000-000000000001";
    const paymentId = "40000000-0000-4000-8000-000000000001";
    const validSignature = `sha256=${"a".repeat(64)}`;
    const handler = createPaymentProviderEventHandler(async (event, signature) => {
      expect(event.amountMinor).toBe(55_000);
      expect(signature).toBe(`sha256=${"a".repeat(64)}`);
      return {
        applicationId,
        fee: { snapshotId: "41000000-0000-4000-8000-000000000001", baseFeeMinor: 50_000, serviceChargeMinor: 5_000, totalAmountMinor: 55_000, currency: "INR" },
        attempt: { id: paymentId, status: "SUCCEEDED", attemptNumber: 1, providerReference: "SYN-PAY-40000000-0000-4000-8000-000000000001", createdAt: "2026-08-23T12:00:00.000Z", updatedAt: "2026-08-23T12:00:00.000Z", succeededAt: "2026-08-23T12:00:00.000Z" },
      };
    });
    const response = await handler(new Request("http://localhost/api/v1/payment-provider/events", {
      method: "POST",
      headers: { "content-type": "application/json", "x-raahsathi-provider-signature": validSignature },
      body: JSON.stringify({ eventId: "evt_phase4_route_0001", providerReference: "SYN-PAY-40000000-0000-4000-8000-000000000001", outcome: "SUCCESS", amountMinor: 55_000, occurredAt: "2026-08-23T12:00:00.000Z" }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ attempt: { status: "SUCCEEDED" } });
  });

  it("rejects cross-origin and malformed OTP requests before database work", async () => {
    const crossOrigin = await requestOtp(new Request("http://localhost/api/v1/auth/request-otp", {
      method: "POST",
      headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
      body: JSON.stringify({ mobileNumber: "9000000000" }),
    }));
    expect(crossOrigin.status).toBe(403);

    const malformed = await requestOtp(new Request("http://localhost/api/v1/auth/request-otp", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ mobileNumber: "9000000000", unexpected: true }),
    }));
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({ error: { code: "VALIDATION_FAILED" } });
  });

  it("serves validated OTP, session cookie, and current-user contracts with controlled services", async () => {
    const challengeId = "20000000-0000-4000-8000-000000000001";
    const user = { id: "10000000-0000-4000-8000-000000000001", displayName: "RaahSathi Demo", preferredLocale: "en" as const };
    const requestHandler = createRequestOtpHandler(async () => ({
      challengeId,
      maskedDestination: "••••••0000",
      expiresAt: "2026-08-23T10:05:00.000Z",
      resendAvailableAt: "2026-08-23T10:01:00.000Z",
    }));
    const challengeResponse = await requestHandler(new Request("http://localhost/api/v1/auth/request-otp", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ mobileNumber: "9000000000" }),
    }));
    expect(challengeResponse.status).toBe(202);
    expect(await challengeResponse.json()).toMatchObject({ challengeId, maskedDestination: "••••••0000" });

    const verifyHandler = createVerifyOtpHandler(async () => ({
      summary: { user }, sessionToken: "opaque-session", csrfToken: "csrf-token",
      absoluteExpiresAt: new Date("2026-08-23T18:00:00.000Z"),
    }));
    const verifyResponse = await verifyHandler(new Request("http://localhost/api/v1/auth/verify-otp", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ challengeId, otp: "123456", preferredLocale: "en" }),
    }));
    expect(verifyResponse.status).toBe(200);
    const cookies = verifyResponse.headers.getSetCookie().join(";");
    expect(cookies).toContain("raahsathi_session=opaque-session");
    expect(cookies).toContain("HttpOnly");
    expect(cookies).toContain("raahsathi_csrf=csrf-token");

    const meHandler = createMeHandler(async () => ({
      kind: "authenticated", context: { sessionId: "session", applicantId: user.id }, user, csrfSecretHash: "hash",
    }));
    const meResponse = await meHandler(new Request("http://localhost/api/v1/me"));
    expect(await meResponse.json()).toEqual({ user });
    expect(meResponse.headers.get("cache-control")).toBe("no-store");
  });
});
