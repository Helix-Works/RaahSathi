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
  paymentEventInvalid: () => new ApiError(400, "PAYMENT_EVENT_INVALID", "payments.errors.invalidProviderEvent"),
  appointmentNotEligible: () => new ApiError(409, "APPOINTMENT_NOT_ELIGIBLE", "appointments.errors.notEligible"),
  appointmentAlreadyBooked: () => new ApiError(409, "APPOINTMENT_ALREADY_BOOKED", "appointments.errors.alreadyBooked"),
  appointmentUnavailable: (reason: "CAPACITY_FULL" | "SLOTS_NOT_RELEASED" | "SLOT_ELAPSED" | "CENTER_UNAVAILABLE" | "BOOKING_SERVICE_UNAVAILABLE") =>
    new ApiError(409, reason, `appointments.reasons.${reason}`),
  appointmentRateLimited: () => new ApiError(429, "APPOINTMENT_RATE_LIMITED", "appointments.errors.rateLimited", { retryable: true, retryAfter: 60 }),
  appointmentCapacityInvariant: () => new ApiError(500, "APPOINTMENT_CAPACITY_INVARIANT", "errors.internalServerError"),
  waitlistNotEligible: () => new ApiError(409, "WAITLIST_NOT_ELIGIBLE", "waitlist.errors.notEligible"),
  waitlistAlreadyActive: () => new ApiError(409, "WAITLIST_ALREADY_ACTIVE", "waitlist.errors.alreadyActive"),
  waitlistOfferActive: () => new ApiError(409, "WAITLIST_OFFER_ACTIVE", "waitlist.errors.offerActive"),
  waitlistRateLimited: () => new ApiError(429, "WAITLIST_RATE_LIMITED", "waitlist.errors.rateLimited", { retryable: true, retryAfter: 60 }),
  offerExpired: () => new ApiError(409, "OFFER_EXPIRED", "waitlist.errors.offerExpired"),
  offerAlreadyConsumed: () => new ApiError(409, "OFFER_ALREADY_CONSUMED", "waitlist.errors.offerConsumed"),
  offerStateConflict: () => new ApiError(409, "OFFER_STATE_CONFLICT", "waitlist.errors.offerConflict"),
};
