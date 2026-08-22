import { ApiError, type ApiErrorBody } from "./api-error";
import { getCorrelationId } from "./correlation-id";

export interface ApiRequestContext {
  correlationId: string;
  request: Request;
}

type ApiHandler = (context: ApiRequestContext) => Promise<Response> | Response;

function errorResponse(error: ApiError, correlationId: string): Response {
  const body: ApiErrorBody = {
    error: { code: error.code, messageKey: error.messageKey, correlationId },
  };
  return Response.json(body, { status: error.status });
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
      console.error(JSON.stringify({
        correlationId,
        exceptionType: reason instanceof Error ? reason.constructor.name : "UnknownException",
        method: request.method,
        path: new URL(request.url).pathname,
      }));
    }
    response = errorResponse(error, correlationId);
  }

  response.headers.set("x-request-id", correlationId);
  return response;
}
