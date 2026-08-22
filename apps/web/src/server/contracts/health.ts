import { z } from "zod";

import type { EndpointContract, ResponseHeaderContract } from "./endpoint";

export const requestIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/);

export const requestIdHeaderContract: ResponseHeaderContract = {
  componentName: "RequestId",
  description: "Safe caller-provided request ID or a generated UUID used for correlation.",
  schema: requestIdSchema,
};

const responseHeaders = { "x-request-id": requestIdHeaderContract };

export const healthResponseSchema = z.strictObject({ status: z.literal("ok") });
export const readinessResponseSchema = z.strictObject({
  status: z.literal("ready"),
  database: z.literal("up"),
});
export const apiErrorSchema = z.strictObject({
  error: z.strictObject({
    code: z.string(),
    messageKey: z.string(),
    correlationId: requestIdSchema,
    retryable: z.boolean().optional(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export const healthEndpointContract = {
  method: "get",
  path: "/api/v1/health",
  operationId: "getHealth",
  summary: "Check application liveness",
  success: {
    status: 200,
    description: "Application is live.",
    schemaName: "HealthResponse",
    schema: healthResponseSchema,
    headers: responseHeaders,
  },
  errors: [{ status: 500, description: "Sanitized server error." }],
} as const satisfies EndpointContract;

export const readinessEndpointContract = {
  method: "get",
  path: "/api/v1/health/ready",
  operationId: "getReadiness",
  summary: "Check application and database readiness",
  success: {
    status: 200,
    description: "Application and database are ready.",
    schemaName: "ReadinessResponse",
    schema: readinessResponseSchema,
    headers: responseHeaders,
  },
  errors: [
    { status: 500, description: "Sanitized server error." },
    { status: 503, description: "Database dependency unavailable." },
  ],
} as const satisfies EndpointContract;

export const healthEndpointContracts: readonly EndpointContract[] = [
  healthEndpointContract,
  readinessEndpointContract,
];
