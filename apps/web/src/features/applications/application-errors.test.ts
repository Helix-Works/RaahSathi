import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/api";

import {
  getApplicationErrorPresentation,
  readApplicationFieldErrors,
} from "./application-errors";

const messages = {
  validationError: "validation",
  sessionExpiredError: "session",
  forbiddenError: "forbidden",
  notFoundError: "missing",
  conflictError: "conflict",
  transitionError: "transition",
  networkError: "network",
  genericError: "generic",
} as const;

describe("application API error presentation", () => {
  it("maps revision conflicts to a safe reload action", () => {
    expect(getApplicationErrorPresentation(new ApiClientError({
      status: 409,
      code: "APPLICATION_REVISION_CONFLICT",
      messageKey: "applications.errors.revisionConflict",
      correlationId: "request-123",
      retryable: false,
    }), messages)).toEqual({
      message: "conflict",
      action: "reload",
      correlationId: "request-123",
    });
  });

  it("maps session expiry to reauthentication without exposing raw messages", () => {
    expect(getApplicationErrorPresentation(new ApiClientError({
      status: 401,
      code: "AUTH_SESSION_EXPIRED",
      messageKey: "auth.errors.sessionExpired",
      retryable: false,
    }), messages)).toEqual({ message: "session", action: "sign-in" });
  });

  it("extracts only known data fields and reports unmapped fields", () => {
    const result = readApplicationFieldErrors(new ApiClientError({
      status: 400,
      code: "VALIDATION_FAILED",
      messageKey: "errors.validationFailed",
      retryable: false,
      fieldErrors: {
        "data.postalCode": ["invalid_format"],
        "data.unexpected": ["unrecognized_keys"],
      },
    }), ["district", "postalCode"]);

    expect(result).toEqual({
      mapped: { postalCode: "invalid_format" },
      hasUnmapped: true,
    });
  });
});
