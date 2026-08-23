import { describe, expect, it } from "vitest";

import { GET as getUnknown } from "./[...path]/route";
import { GET as getHealth } from "./health/route";
import { createReadinessHandler } from "./health/ready/route";
import { createRequestOtpHandler, POST as requestOtp } from "./auth/request-otp/route";
import { createVerifyOtpHandler } from "./auth/verify-otp/route";
import { createMeHandler } from "./me/route";
import { GET as getServices } from "./services/route";
import { POST as createApplication } from "./applications/route";
import { POST as startIdentity } from "./applications/[id]/identity-attempts/route";

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
