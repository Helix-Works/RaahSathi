import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

import type { RequestWithCorrelationId } from "./correlation-id.middleware";

interface ErrorDescriptor {
  code: string;
  messageKey: string;
}

interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: unknown): void;
}

const errorDescriptors: Partial<Record<number, ErrorDescriptor>> = {
  [HttpStatus.BAD_REQUEST]: {
    code: "VALIDATION_FAILED",
    messageKey: "errors.validationFailed",
  },
  [HttpStatus.UNAUTHORIZED]: {
    code: "AUTHENTICATION_REQUIRED",
    messageKey: "errors.authenticationRequired",
  },
  [HttpStatus.FORBIDDEN]: {
    code: "ACCESS_DENIED",
    messageKey: "errors.accessDenied",
  },
  [HttpStatus.NOT_FOUND]: {
    code: "RESOURCE_NOT_FOUND",
    messageKey: "errors.resourceNotFound",
  },
  [HttpStatus.CONFLICT]: {
    code: "CONFLICT",
    messageKey: "errors.conflict",
  },
  [HttpStatus.PAYLOAD_TOO_LARGE]: {
    code: "REQUEST_TOO_LARGE",
    messageKey: "errors.requestTooLarge",
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: "RATE_LIMIT_EXCEEDED",
    messageKey: "errors.rateLimitExceeded",
  },
  [HttpStatus.SERVICE_UNAVAILABLE]: {
    code: "DEPENDENCY_UNAVAILABLE",
    messageKey: "errors.dependencyUnavailable",
  },
};

const fallbackClientError: ErrorDescriptor = {
  code: "REQUEST_FAILED",
  messageKey: "errors.requestFailed",
};

const internalServerError: ErrorDescriptor = {
  code: "INTERNAL_SERVER_ERROR",
  messageKey: "errors.internalServerError",
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithCorrelationId>();
    const response = context.getResponse<HttpResponse>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const descriptor =
      errorDescriptors[status] ??
      (status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? internalServerError
        : fallbackClientError);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({
        correlationId: request.correlationId,
        exceptionType:
          exception instanceof Error ? exception.constructor.name : "UnknownException",
        method: request.method,
        path: request.path,
      });
    }

    response.status(status).json({
      error: {
        ...descriptor,
        correlationId: request.correlationId,
      },
    });
  }
}
