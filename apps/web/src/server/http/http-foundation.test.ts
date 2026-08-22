import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ApiError } from "./api-error";
import { getCorrelationId } from "./correlation-id";
import { handleApiRequest } from "./handle-api-request";
import { parseJsonBody } from "./json-body";
import { assertSameOriginMutation } from "./origin";

const strictPayload = z.strictObject({ name: z.string() });

describe("HTTP foundation", () => {
  it("preserves safe correlation IDs and replaces unsafe values", () => {
    expect(getCorrelationId(new Request("http://localhost/api", { headers: { "x-request-id": "demo-request-123" } }))).toBe("demo-request-123");
    expect(getCorrelationId(new Request("http://localhost/api", { headers: { "x-request-id": "unsafe request id" } }))).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("returns stable errors without leaking exception details", async () => {
    const originalError = console.error;
    console.error = () => undefined;
    try {
      const response = await handleApiRequest(
        new Request("http://localhost/api/v1/fail", { headers: { "x-request-id": "safe-id" } }),
        () => { throw new Error("password=secret host=private.invalid"); },
      );
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: { code: "INTERNAL_SERVER_ERROR", messageKey: "errors.internalServerError", correlationId: "safe-id" } });
    } finally {
      console.error = originalError;
    }
  });

  it("rejects malformed, unexpected, oversized, and wrongly typed bodies", async () => {
    const unexpected = new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "ok", unexpected: true }) });
    await expect(parseJsonBody(unexpected, strictPayload)).rejects.toMatchObject({ status: 400, code: "VALIDATION_FAILED" });

    const malformed = new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
    await expect(parseJsonBody(malformed, strictPayload)).rejects.toMatchObject({ status: 400 });

    const wrongType = new Request("http://localhost/api", { method: "POST", headers: { "content-type": "text/plain" }, body: "hello" });
    await expect(parseJsonBody(wrongType, strictPayload)).rejects.toMatchObject({ status: 415 });

    const oversized = new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json", "content-length": "70000" }, body: "{}" });
    await expect(parseJsonBody(oversized, strictPayload)).rejects.toMatchObject({ status: 413 });
  });

  it("requires same-origin browser mutations", () => {
    expect(() => assertSameOriginMutation(new Request("https://app.example/api", { method: "POST", headers: { origin: "https://app.example" } }))).not.toThrow();
    expect(() => assertSameOriginMutation(new Request("https://app.example/api", { method: "POST", headers: { origin: "https://attacker.invalid" } }))).toThrow(ApiError);
  });
});
