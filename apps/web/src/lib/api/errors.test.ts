import { describe, expect, it } from "vitest";

import { normalizeApiError } from "./errors";

describe("API error normalization", () => {
  it("reads the authoritative nested error envelope and request ID header", () => {
    const response = new Response(null, {
      status: 503,
      headers: { "x-request-id": "header-request-id" },
    });
    const error = normalizeApiError(response, {
      error: {
        code: "DEPENDENCY_UNAVAILABLE",
        messageKey: "errors.dependencyUnavailable",
        correlationId: "body-request-id",
      },
    });

    expect(error).toMatchObject({
      status: 503,
      code: "DEPENDENCY_UNAVAILABLE",
      messageKey: "errors.dependencyUnavailable",
      correlationId: "header-request-id",
      retryable: true,
    });
  });

  it("normalizes a numeric Retry-After header without trusting the response body", () => {
    const response = new Response(null, {
      status: 429,
      headers: { "retry-after": "60" },
    });

    expect(normalizeApiError(response, {}).retryAfterSeconds).toBe(60);
  });

  it.each(["60.5", "60abc", "1e2", "-1", "9007199254740992"])("rejects malformed Retry-After seconds: %s", (retryAfter) => {
    const response = new Response(null, { status: 429, headers: { "retry-after": retryAfter } });
    expect(normalizeApiError(response, {}).retryAfterSeconds).toBeUndefined();
  });
});
