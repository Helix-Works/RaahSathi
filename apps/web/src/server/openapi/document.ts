import { z } from "zod";

import {
  apiErrorSchema,
  endpointContracts,
  requestIdHeaderContract,
} from "../contracts/health";
import type { JsonResponseContract } from "../contracts/endpoint";

function schemaFor(schema: z.ZodType): Record<string, unknown> {
  const generated = z.toJSONSchema(schema, { target: "draft-2020-12" }) as Record<string, unknown>;
  const openApiSchema = { ...generated };
  delete openApiSchema.$schema;
  return openApiSchema;
}

function responseHeaders(response: JsonResponseContract): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(response.headers).map(([name, header]) => [
      name,
      { $ref: `#/components/headers/${header.componentName}` },
    ]),
  );
}

export function createOpenApiDocument(): Record<string, unknown> {
  const paths: Record<string, unknown> = {};
  const successSchemas: Record<string, unknown> = {};

  for (const endpoint of endpointContracts) {
    successSchemas[endpoint.success.schemaName] = schemaFor(endpoint.success.schema);
    const headers = responseHeaders(endpoint.success);
    const responses: Record<string, unknown> = {
      [endpoint.success.status]: {
        description: endpoint.success.description,
        headers,
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${endpoint.success.schemaName}` },
          },
        },
      },
    };

    for (const error of endpoint.errors) {
      responses[error.status] = {
        description: error.description,
        headers,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
        },
      };
    }

    paths[endpoint.path] = {
      [endpoint.method]: {
        operationId: endpoint.operationId,
        summary: endpoint.summary,
        responses,
      },
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "RaahSathi API",
      version: "0.1.0",
      description: "Same-origin Next.js Route Handler API for the RaahSathi synthetic-data prototype.",
    },
    paths,
    components: {
      headers: {
        [requestIdHeaderContract.componentName]: {
          description: requestIdHeaderContract.description,
          schema: schemaFor(requestIdHeaderContract.schema),
        },
      },
      schemas: { ApiError: schemaFor(apiErrorSchema), ...successSchemas },
    },
  };
}

export function serializeOpenApiDocument(): string {
  return `${JSON.stringify(createOpenApiDocument(), null, 2)}\n`;
}
