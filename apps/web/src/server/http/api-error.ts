export interface ApiErrorBody {
  error: {
    code: string;
    messageKey: string;
    correlationId: string;
    retryable?: boolean;
    fieldErrors?: Readonly<Record<string, readonly string[]>>;
  };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly messageKey: string,
    readonly options: Readonly<{
      retryable?: boolean;
      retryAfter?: number;
      fieldErrors?: Readonly<Record<string, readonly string[]>>;
    }> = {},
  ) {
    super(code);
    this.name = "ApiError";
  }
}

export const apiErrors = {
  validation: (fieldErrors?: Readonly<Record<string, readonly string[]>>) => new ApiError(400, "VALIDATION_FAILED", "errors.validationFailed", { fieldErrors }),
  unauthorized: () => new ApiError(401, "AUTHENTICATION_REQUIRED", "errors.authenticationRequired"),
  sessionExpired: () => new ApiError(401, "AUTH_SESSION_EXPIRED", "auth.errors.sessionExpired"),
  forbidden: () => new ApiError(403, "ACCESS_DENIED", "errors.accessDenied"),
  conflict: () => new ApiError(409, "APPLICATION_REVISION_CONFLICT", "applications.errors.revisionConflict"),
  invalidTransition: () => new ApiError(409, "APPLICATION_TRANSITION_INVALID", "applications.errors.invalidTransition"),
  csrfInvalid: () => new ApiError(403, "CSRF_INVALID", "auth.errors.csrfInvalid"),
  notFound: () => new ApiError(404, "RESOURCE_NOT_FOUND", "errors.resourceNotFound"),
  unsupportedMediaType: () => new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "errors.unsupportedMediaType"),
  tooLarge: () => new ApiError(413, "REQUEST_TOO_LARGE", "errors.requestTooLarge"),
  rateLimited: () => new ApiError(429, "RATE_LIMIT_EXCEEDED", "errors.rateLimitExceeded", { retryable: true }),
  unavailable: () => new ApiError(503, "DEPENDENCY_UNAVAILABLE", "errors.dependencyUnavailable"),
  authOtpInvalid: () => new ApiError(400, "AUTH_OTP_INVALID", "auth.errors.invalidOtp"),
  authOtpExpired: () => new ApiError(400, "AUTH_OTP_EXPIRED", "auth.errors.expiredOtp"),
  authAttemptsExhausted: () => new ApiError(429, "AUTH_ATTEMPTS_EXHAUSTED", "auth.errors.attemptsExhausted"),
  authRateLimited: (retryAfter: number) => new ApiError(429, "AUTH_RATE_LIMITED", "auth.errors.rateLimited", { retryable: true, retryAfter }),
  authProviderUnavailable: () => new ApiError(503, "AUTH_PROVIDER_UNAVAILABLE", "auth.errors.providerUnavailable", { retryable: true }),
};
