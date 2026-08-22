import { ApiClientError } from "@/lib/api";

type AuthErrorMessages = Readonly<{
  invalidOtp: string;
  expiredOtp: string;
  attemptsExhausted: string;
  rateLimited: string;
  providerUnavailable: string;
  genericFailure: string;
}>;

export type AuthErrorPresentation = Readonly<{
  message: string;
  correlationId?: string;
}>;

export function getAuthErrorPresentation(
  error: unknown,
  messages: AuthErrorMessages,
): AuthErrorPresentation {
  if (!(error instanceof ApiClientError)) {
    return { message: messages.genericFailure };
  }

  const messageByCode: Readonly<Record<string, string>> = {
    AUTH_OTP_INVALID: messages.invalidOtp,
    AUTH_OTP_EXPIRED: messages.expiredOtp,
    AUTH_ATTEMPTS_EXHAUSTED: messages.attemptsExhausted,
    AUTH_RATE_LIMITED: messages.rateLimited,
    AUTH_PROVIDER_UNAVAILABLE: messages.providerUnavailable,
  };

  return {
    message: messageByCode[error.code] ?? messages.genericFailure,
    correlationId: error.correlationId,
  };
}
