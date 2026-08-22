import type { Locale } from "@/i18n";

/**
 * Provisional frontend view types. Replace with generated OpenAPI contracts once
 * the backend auth/session endpoints and cookie contract are authoritative.
 */
export type CurrentUser = Readonly<{
  id: string;
  displayName: string;
  preferredLocale: Locale;
}>;

export type SessionSummary = Readonly<{
  user: CurrentUser;
}>;

export type OtpChallenge = Readonly<{
  challengeId: string;
  maskedDestination: string;
}>;

export type RequestOtpInput = Readonly<{
  mobileNumber: string;
}>;

export type VerifyOtpInput = Readonly<{
  challengeId: string;
  otp: string;
}>;

export type MockSessionScenario = "active" | "empty" | "appointment" | "expired";

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
