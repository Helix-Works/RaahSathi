import { Prisma } from "@prisma/client";

import { ApiError, type ApiErrorBody } from "./api-error";
import { getCorrelationId } from "./correlation-id";

export interface ApiRequestContext {
  correlationId: string;
  request: Request;
}

type ApiHandler = (context: ApiRequestContext) => Promise<Response> | Response;

const safePrismaMetaKeys = [
  "code",
  "modelName",
  "table",
  "column",
  "constraint",
  "field_name",
  "target",
] as const;

function safePrismaMeta(meta: Record<string, unknown> | undefined): Readonly<Record<string, unknown>> | undefined {
  if (!meta) return undefined;

  const safeEntries = safePrismaMetaKeys.flatMap((key) => {
    const value = meta[key];
    const isSafeValue = typeof value === "string"
      || (Array.isArray(value) && value.every((item) => typeof item === "string"));
    return isSafeValue ? [[key, value] as const] : [];
  });

  return safeEntries.length > 0 ? Object.fromEntries(safeEntries) : undefined;
}

function errorResponse(error: ApiError, correlationId: string): Response {
  const body: ApiErrorBody = {
    error: {
      code: error.code,
      messageKey: error.messageKey,
      correlationId,
      ...(error.options.retryable === undefined ? {} : { retryable: error.options.retryable }),
      ...(error.options.fieldErrors ? { fieldErrors: error.options.fieldErrors } : {}),
    },
  };
  const response = Response.json(body, { status: error.status });
  if (error.options.retryAfter !== undefined) response.headers.set("retry-after", String(error.options.retryAfter));
  return response;
}

export async function handleApiRequest(request: Request, handler: ApiHandler): Promise<Response> {
  const correlationId = getCorrelationId(request);
  let response: Response;

  try {
    response = await handler({ correlationId, request });
  } catch (reason) {
    const error = reason instanceof ApiError
      ? reason
      : new ApiError(500, "INTERNAL_SERVER_ERROR", "errors.internalServerError");

    if (!(reason instanceof ApiError) || error.status >= 500) {
      const prismaDiagnostics = process.env.NODE_ENV !== "production"
        && reason instanceof Prisma.PrismaClientKnownRequestError
        ? {
            prismaCode: reason.code,
            prismaMeta: safePrismaMeta(reason.meta),
          }
        : {};

      console.error(JSON.stringify({
        correlationId,
        exceptionType: reason instanceof Error ? reason.constructor.name : "UnknownException",
        method: request.method,
        path: new URL(request.url).pathname,
        ...prismaDiagnostics,
      }));
    }
    response = errorResponse(error, correlationId);
  }

  response.headers.set("x-request-id", correlationId);
  return response;
}
