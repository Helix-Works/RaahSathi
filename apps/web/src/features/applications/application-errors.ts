import { ApiClientError } from "@/lib/api";

export type ApplicationErrorAction = "reload" | "sign-in";

export type ApplicationErrorPresentation = Readonly<{
  message: string;
  action?: ApplicationErrorAction;
  correlationId?: string;
}>;

type ErrorMessages = Readonly<{
  validationError: string;
  sessionExpiredError: string;
  forbiddenError: string;
  notFoundError: string;
  conflictError: string;
  transitionError: string;
  networkError: string;
  genericError: string;
}>;

export function getApplicationErrorPresentation(
  error: unknown,
  messages: ErrorMessages,
): ApplicationErrorPresentation {
  if (!(error instanceof ApiClientError)) {
    return { message: messages.genericError };
  }

  const withReference = (message: string, action?: ApplicationErrorAction) => ({
    message,
    ...(action ? { action } : {}),
    ...(error.correlationId ? { correlationId: error.correlationId } : {}),
  });

  if (error.status === 401) return withReference(messages.sessionExpiredError, "sign-in");
  if (error.status === 403) return withReference(messages.forbiddenError);
  if (error.status === 404) return withReference(messages.notFoundError);
  if (error.code === "APPLICATION_REVISION_CONFLICT") {
    return withReference(messages.conflictError, "reload");
  }
  if (error.code === "APPLICATION_TRANSITION_INVALID") {
    return withReference(messages.transitionError, "reload");
  }
  if (error.status === 0) return withReference(messages.networkError);
  if (error.code === "VALIDATION_FAILED") return withReference(messages.validationError);
  return withReference(messages.genericError);
}

export function readApplicationFieldErrors(
  error: unknown,
  knownFields: readonly string[],
): Readonly<{ mapped: Readonly<Record<string, string>>; hasUnmapped: boolean }> {
  if (!(error instanceof ApiClientError) || !error.fieldErrors) {
    return { mapped: {}, hasUnmapped: false };
  }

  const mapped: Record<string, string> = {};
  let hasUnmapped = false;

  for (const [path, codes] of Object.entries(error.fieldErrors)) {
    const field = path.startsWith("data.") ? path.slice("data.".length) : path;
    const code = codes[0];
    if (code && knownFields.includes(field)) {
      mapped[field] = code;
    } else {
      hasUnmapped = true;
    }
  }

  return { mapped, hasUnmapped };
}
