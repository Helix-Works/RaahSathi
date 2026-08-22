import { describe, expect, it } from "vitest";

import { GET as getUnknown } from "./[...path]/route";
import { GET as getHealth } from "./health/route";
import { createReadinessHandler } from "./health/ready/route";

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
});
