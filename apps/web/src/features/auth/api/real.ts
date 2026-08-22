import { apiRequest } from "@/lib/api";

import { otpChallengeSchema, sessionSummarySchema } from "@raahsathi/contracts/auth";
import type { AuthApi, OtpChallenge, RequestOtpInput, SessionSummary, VerifyOtpInput } from "../types";

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

export const realAuthApi: AuthApi = {
  requestOtp: requestRealOtp,
  verifyOtp: verifyRealOtp,
  logout: logoutRealSession,
};
