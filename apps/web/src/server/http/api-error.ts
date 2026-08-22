export interface ApiErrorBody {
  error: {
    code: string;
    messageKey: string;
    correlationId: string;
  };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly messageKey: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

export const apiErrors = {
  validation: () => new ApiError(400, "VALIDATION_FAILED", "errors.validationFailed"),
  unauthorized: () => new ApiError(401, "AUTHENTICATION_REQUIRED", "errors.authenticationRequired"),
  forbidden: () => new ApiError(403, "ACCESS_DENIED", "errors.accessDenied"),
  notFound: () => new ApiError(404, "RESOURCE_NOT_FOUND", "errors.resourceNotFound"),
  unsupportedMediaType: () => new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "errors.unsupportedMediaType"),
  tooLarge: () => new ApiError(413, "REQUEST_TOO_LARGE", "errors.requestTooLarge"),
  rateLimited: () => new ApiError(429, "RATE_LIMIT_EXCEEDED", "errors.rateLimitExceeded"),
  unavailable: () => new ApiError(503, "DEPENDENCY_UNAVAILABLE", "errors.dependencyUnavailable"),
};
