import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/api";

import { getPaymentErrorPresentation } from "./payment-errors";

const messages = {
  sessionExpiredError: "session",
  forbiddenError: "forbidden",
  notFoundError: "missing",
  notAllowedError: "not allowed",
  idempotencyConflictError: "idempotency",
  providerError: "provider",
  rateLimitedError: "rate limited",
  networkError: "network",
  invalidResponseError: "invalid response",
  genericError: "generic",
};

function apiError(status: number, code: string, fieldErrors?: Readonly<Record<string, readonly string[]>>) {
  return new ApiClientError({
    status,
    code,
    messageKey: "errors.safe",
    retryable: status === 0 || status >= 429,
    correlationId: "payment-correlation",
    fieldErrors,
  });
}

describe("payment error presentation", () => {
  it("offers safe application-detail reauthentication for an expired session", () => {
    expect(getPaymentErrorPresentation(apiError(401, "AUTH_SESSION_EXPIRED"), messages)).toEqual({
      message: "session",
      action: "sign-in",
      blocksPaymentAction: true,
      correlationId: "payment-correlation",
    });
  });

  it("keeps ambiguous transport and dependency retries on the same logical initiation", () => {
    expect(getPaymentErrorPresentation(apiError(0, "NETWORK_ERROR"), messages)).toMatchObject({
      message: "network",
      retrySameInitiation: true,
    });
    expect(getPaymentErrorPresentation(apiError(503, "DEPENDENCY_UNAVAILABLE"), messages)).toMatchObject({
      message: "provider",
      retrySameInitiation: true,
    });
  });

  it("discards only an idempotency key rejected for conflicting reuse", () => {
    expect(getPaymentErrorPresentation(apiError(400, "VALIDATION_FAILED", {
      idempotencyKey: ["already_used"],
    }), messages)).toMatchObject({
      message: "idempotency",
      discardInitiation: true,
    });
    expect(getPaymentErrorPresentation(apiError(409, "APPLICATION_TRANSITION_INVALID"), messages)).toMatchObject({
      message: "not allowed",
      action: "reload",
      blocksPaymentAction: true,
    });
  });
});
