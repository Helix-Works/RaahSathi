import { z } from "zod";

import { apiErrorSchema, healthResponseSchema, readinessResponseSchema } from "../contracts/health";

interface EndpointDefinition {
  method: "get";
  path: string;
  operationId: string;
  summary: string;
  successSchema: "HealthResponse" | "ReadinessResponse";
}

const endpoints: EndpointDefinition[] = [
  { method: "get", path: "/api/v1/health", operationId: "getHealth", summary: "Check application liveness", successSchema: "HealthResponse" },
  { method: "get", path: "/api/v1/health/ready", operationId: "getReadiness", summary: "Check application and database readiness", successSchema: "ReadinessResponse" },
];

function schemaFor(schema: z.ZodType): Record<string, unknown> {
  const generated = z.toJSONSchema(schema, { target: "draft-2020-12" }) as Record<string, unknown>;
  const openApiSchema = { ...generated };
  delete openApiSchema.$schema;
  return openApiSchema;
}

export function createOpenApiDocument(): Record<string, unknown> {
  const paths: Record<string, unknown> = {};
  for (const endpoint of endpoints) {
    paths[endpoint.path] = {
      [endpoint.method]: {
        operationId: endpoint.operationId,
        summary: endpoint.summary,
        responses: {
          "200": {
            description: "Successful response",
            content: { "application/json": { schema: { $ref: `#/components/schemas/${endpoint.successSchema}` } } },
          },
          "500": {
            description: "Sanitized server error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
          },
          ...(endpoint.successSchema === "ReadinessResponse" ? {
            "503": {
              description: "Database dependency unavailable",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
            },
          } : {}),
        },
      },
    };
  }

  return {
    openapi: "3.1.0",
    info: { title: "RaahSathi API", version: "0.1.0", description: "Same-origin Next.js Route Handler API for the RaahSathi synthetic-data prototype." },
    paths,
    components: {
      schemas: {
        ApiError: schemaFor(apiErrorSchema),
        HealthResponse: schemaFor(healthResponseSchema),
        ReadinessResponse: schemaFor(readinessResponseSchema),
      },
    },
  };
}

export function serializeOpenApiDocument(): string {
  return `${JSON.stringify(createOpenApiDocument(), null, 2)}\n`;
}
