import { apiRequest } from "@/lib/api";

import type {
  AuthApi,
  OtpChallenge,
  RequestOtpInput,
  SessionSummary,
  VerifyOtpInput,
} from "../types";
import { otpChallengeSchema, sessionSummarySchema } from "./wire";

/**
 * Provisional real adapter. Endpoint names follow PLAN.md, but response shapes
 * and CSRF transport must be reconciled with backend OpenAPI before integration
 * can be declared complete.
 */
async function requestRealOtp(input: RequestOtpInput): Promise<OtpChallenge> {
  const payload = await apiRequest("/auth/request-otp", {
    method: "POST",
    json: input,
  });

  return otpChallengeSchema.parse(payload);
}

async function verifyRealOtp(input: VerifyOtpInput): Promise<SessionSummary> {
  const payload = await apiRequest("/auth/verify-otp", {
    method: "POST",
    json: input,
  });

  return sessionSummarySchema.parse(payload);
}

async function logoutRealSession(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
}

export async function getRealCurrentUser(cookieHeader: string): Promise<SessionSummary> {
  const payload = await apiRequest("/me", {
    cache: "no-store",
    headers: { Cookie: cookieHeader },
  });
  return sessionSummarySchema.parse(payload);
}

export const realAuthApi: AuthApi = {
  requestOtp: requestRealOtp,
  verifyOtp: verifyRealOtp,
  logout: logoutRealSession,
};
