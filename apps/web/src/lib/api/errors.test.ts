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
});
