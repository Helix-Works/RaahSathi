export type ApiFieldErrors = Readonly<Record<string, readonly string[]>>;

/**
 * Frontend-normalized view of the authoritative Route Handler error envelope.
 */
export type ApiError = Readonly<{
  status: number;
  code: string;
  messageKey: string;
  fieldErrors?: ApiFieldErrors;
  correlationId?: string;
  retryable: boolean;
}>;

const SAFE_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const SAFE_FIELD = /^[A-Za-z0-9][A-Za-z0-9_.[\]-]{0,127}$/;

function safeIdentifier(value: unknown): string | undefined {
  return typeof value === "string" && SAFE_IDENTIFIER.test(value)
    ? value
    : undefined;
}

function readFieldErrors(value: unknown): ApiFieldErrors | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value).flatMap(([field, errors]) => {
    if (!SAFE_FIELD.test(field) || !Array.isArray(errors)) {
      return [];
    }

    const codes = errors.flatMap((error) => {
      const code = safeIdentifier(error);
      return code ? [code] : [];
    });

    return codes.length > 0 ? [[field, codes] as const] : [];
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export class ApiClientError extends Error implements ApiError {
  readonly status: number;
  readonly code: string;
  readonly messageKey: string;
  readonly fieldErrors?: ApiFieldErrors;
  readonly correlationId?: string;
  readonly retryable: boolean;

  constructor(error: ApiError) {
    super(error.messageKey);
    this.name = "ApiClientError";
    this.status = error.status;
    this.code = error.code;
    this.messageKey = error.messageKey;
    this.fieldErrors = error.fieldErrors;
    this.correlationId = error.correlationId;
    this.retryable = error.retryable;
  }
}

export function normalizeApiError(
  response: Response,
  payload: unknown,
): ApiClientError {
  const body =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const error = body.error && typeof body.error === "object" && !Array.isArray(body.error)
    ? (body.error as Record<string, unknown>)
    : {};
  const code = safeIdentifier(error.code) ?? `HTTP_${response.status}`;
  const messageKey = safeIdentifier(error.messageKey) ?? "errors.requestFailed";
  const correlationId =
    safeIdentifier(response.headers.get("x-request-id")) ??
    safeIdentifier(error.correlationId);
  const retryable =
    typeof error.retryable === "boolean"
      ? error.retryable
      : response.status === 429 || response.status >= 500;

  return new ApiClientError({
    status: response.status,
    code,
    messageKey,
    fieldErrors: readFieldErrors(error.fieldErrors),
    correlationId,
    retryable,
  });
}

export function createNetworkError(): ApiClientError {
  return new ApiClientError({
    status: 0,
    code: "NETWORK_ERROR",
    messageKey: "errors.network",
    retryable: true,
  });
}

export function createInvalidResponseError(
  status: number,
  correlationId?: string | null,
): ApiClientError {
  return new ApiClientError({
    status,
    code: "INVALID_API_RESPONSE",
    messageKey: "errors.invalidResponse",
    correlationId: safeIdentifier(correlationId),
    retryable: false,
  });
}
