import { ApiClientError } from "@/lib/api";

export type PaymentErrorAction = "reload" | "sign-in";

export type PaymentErrorPresentation = Readonly<{
  message: string;
  action?: PaymentErrorAction;
  correlationId?: string;
  retrySameInitiation?: boolean;
  discardInitiation?: boolean;
  blocksPaymentAction?: boolean;
}>;

type PaymentErrorMessages = Readonly<{
  sessionExpiredError: string;
  forbiddenError: string;
  notFoundError: string;
  notAllowedError: string;
  idempotencyConflictError: string;
  providerError: string;
  rateLimitedError: string;
  networkError: string;
  invalidResponseError: string;
  genericError: string;
}>;

export function getPaymentErrorPresentation(
  error: unknown,
  messages: PaymentErrorMessages,
): PaymentErrorPresentation {
  if (!(error instanceof ApiClientError)) return { message: messages.genericError };

  const present = (
    message: string,
    options: Omit<PaymentErrorPresentation, "message" | "correlationId"> = {},
  ): PaymentErrorPresentation => ({
    message,
    ...options,
    ...(error.correlationId ? { correlationId: error.correlationId } : {}),
  });

  if (error.status === 401) {
    return present(messages.sessionExpiredError, { action: "sign-in", blocksPaymentAction: true });
  }
  if (error.status === 403) return present(messages.forbiddenError, { blocksPaymentAction: true });
  if (error.status === 404) return present(messages.notFoundError, { blocksPaymentAction: true });
  if (error.status === 409 || error.code === "APPLICATION_TRANSITION_INVALID") {
    return present(messages.notAllowedError, { action: "reload", blocksPaymentAction: true });
  }
  if (error.code === "VALIDATION_FAILED" && error.fieldErrors?.idempotencyKey) {
    return present(messages.idempotencyConflictError, { discardInitiation: true });
  }
  if (error.status === 429) return present(messages.rateLimitedError, { retrySameInitiation: true });
  if (error.status === 0) return present(messages.networkError, { retrySameInitiation: true });
  if (error.code === "INVALID_API_RESPONSE") return present(messages.invalidResponseError, { action: "reload" });
  if (error.status === 503 || error.code === "DEPENDENCY_UNAVAILABLE") {
    return present(messages.providerError, { retrySameInitiation: true });
  }
  if (error.status >= 500) return present(messages.genericError, { retrySameInitiation: true });
  return present(messages.genericError);
}
