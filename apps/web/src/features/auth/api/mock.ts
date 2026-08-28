import { ApiClientError } from "@/lib/api";

import { establishMockSession, revokeMockSession } from "./mock-actions";
import type {
  AuthApi,
  MockSessionScenario,
  OtpChallenge,
  RequestOtpInput,
  SessionSummary,
  VerifyOtpInput,
} from "../types";

function mockAuthError(
  status: number,
  code: string,
  retryable: boolean,
): ApiClientError {
  return new ApiClientError({
    status,
    code,
    messageKey: "errors.requestFailed",
    correlationId: `mock-${code.toLowerCase().replaceAll("_", "-")}`,
    retryable,
  });
}

async function requestMockOtp(input: RequestOtpInput): Promise<OtpChallenge> {
  if (input.mobileNumber.endsWith("01")) {
    throw mockAuthError(429, "AUTH_RATE_LIMITED", true);
  }

  if (input.mobileNumber.endsWith("02")) {
    throw mockAuthError(503, "AUTH_PROVIDER_UNAVAILABLE", true);
  }

  return {
    challengeId: "synthetic-otp-challenge",
    maskedDestination: `••••••${input.mobileNumber.slice(-4)}`,
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    resendAvailableAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

function successfulScenario(otp: string): MockSessionScenario | undefined {
  if (otp === "123456") {
    return "active";
  }

  if (otp === "654321") {
    return "empty";
  }

  if (otp === "333222") {
    return "appointment";
  }

  if (otp === "888888") {
    return "expired";
  }

  return undefined;
}

async function verifyMockOtp(input: VerifyOtpInput): Promise<SessionSummary> {
  const scenario = successfulScenario(input.otp);

  if (scenario) {
    await establishMockSession(scenario);
    return {
      user: {
        id: "synthetic-citizen",
        displayName: "Aarav Mehta",
        preferredLocale: input.preferredLocale,
      },
    };
  }

  const failures: Readonly<Record<string, Readonly<[number, string, boolean]>>> = {
    "222222": [400, "AUTH_OTP_EXPIRED", false],
    "333333": [429, "AUTH_ATTEMPTS_EXHAUSTED", false],
    "444444": [429, "AUTH_RATE_LIMITED", true],
    "555555": [503, "AUTH_PROVIDER_UNAVAILABLE", true],
  };
  const [status, code, retryable] = failures[input.otp] ?? [
    400,
    "AUTH_OTP_INVALID",
    false,
  ];

  throw mockAuthError(status, code, retryable);
}

async function logoutMockSession(): Promise<void> {
  await revokeMockSession();
}

export const mockAuthApi: AuthApi = {
  requestOtp: requestMockOtp,
  verifyOtp: verifyMockOtp,
  logout: logoutMockSession,
};
