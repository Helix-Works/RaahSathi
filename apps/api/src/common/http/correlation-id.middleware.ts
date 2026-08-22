import { randomUUID } from "node:crypto";

const CORRELATION_ID_HEADER = "x-request-id";
const SAFE_CORRELATION_ID = /^[A-Za-z0-9._-]{1,64}$/;

interface HttpRequest {
  header(name: string): string | undefined;
}

interface HttpResponse {
  setHeader(name: string, value: string): void;
}

export interface RequestWithCorrelationId {
  correlationId?: string;
  method: string;
  path: string;
}

export function correlationIdMiddleware(
  request: HttpRequest,
  response: HttpResponse,
  next: () => void,
): void {
  const suppliedCorrelationId = request.header(CORRELATION_ID_HEADER);
  const correlationId =
    suppliedCorrelationId !== undefined && SAFE_CORRELATION_ID.test(suppliedCorrelationId)
      ? suppliedCorrelationId
      : randomUUID();

  (request as HttpRequest & RequestWithCorrelationId).correlationId = correlationId;
  response.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}
