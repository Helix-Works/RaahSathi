import type { CurrentUser, OtpChallenge, RequestOtpInput, SessionSummary, VerifyOtpInput } from "@raahsathi/contracts/auth";

/**
 * Provisional frontend view types. Replace with generated OpenAPI contracts once
 * the backend auth/session endpoints and cookie contract are authoritative.
 */
export type { CurrentUser, OtpChallenge, RequestOtpInput, SessionSummary, VerifyOtpInput };

export type MockSessionScenario = "active" | "empty" | "appointment" | "expired";

export type ReviewerLoginHint = Readonly<{
  mobileNumber: string;
  otp: string;
  mobileLabel: string;
  otpLabel: string;
  notice: string;
}>;

export type ShellSession =
  | Readonly<{ kind: "anonymous" }>
  | Readonly<{ kind: "expired" }>
  | Readonly<{
      kind: "authenticated";
      user: CurrentUser;
    }>;

export type AuthApi = Readonly<{
  requestOtp(input: RequestOtpInput): Promise<OtpChallenge>;
  verifyOtp(input: VerifyOtpInput): Promise<SessionSummary>;
  logout(): Promise<void>;
}>;
