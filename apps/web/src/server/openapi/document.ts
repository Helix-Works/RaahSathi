import { z } from "zod";

import {
  apiErrorSchema,
} from "../contracts/health";
import { healthEndpointContracts } from "../contracts/health";
import { authEndpointContracts } from "../contracts/auth";
import { applicationEndpointContracts } from "../contracts/applications";
import type { ResponseHeaderContract } from "../contracts/endpoint";

function schemaFor(schema: z.ZodType): Record<string, unknown> {
  const generated = z.toJSONSchema(schema, { target: "draft-2020-12" }) as Record<string, unknown>;
  const openApiSchema = { ...generated };
  delete openApiSchema.$schema;
  return openApiSchema;
}

function responseHeaders(response: Readonly<{ headers: Record<string, ResponseHeaderContract> }>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(response.headers).map(([name, header]) => [
      name,
      { $ref: `#/components/headers/${header.componentName}` },
    ]),
  );
}

export function createOpenApiDocument(): Record<string, unknown> {
  const endpointContracts = [...healthEndpointContracts, ...authEndpointContracts, ...applicationEndpointContracts];
  const paths: Record<string, unknown> = {};
  const successSchemas: Record<string, unknown> = {};
  const requestSchemas: Record<string, unknown> = {};
  const componentHeaders: Record<string, unknown> = {};

  for (const endpoint of endpointContracts) {
    if ("schema" in endpoint.success) successSchemas[endpoint.success.schemaName] = schemaFor(endpoint.success.schema);
    if (endpoint.request) requestSchemas[endpoint.request.schemaName] = schemaFor(endpoint.request.schema);
    for (const header of [
      ...Object.values(endpoint.success.headers),
      ...endpoint.errors.flatMap((error) => Object.values(error.headers ?? {})),
    ]) {
      componentHeaders[header.componentName] = { description: header.description, schema: schemaFor(header.schema) };
    }
    const headers = responseHeaders(endpoint.success);
    const responses: Record<string, unknown> = {
      [endpoint.success.status]: {
        description: endpoint.success.description,
        headers,
        ...("schema" in endpoint.success ? { content: { "application/json": { schema: { $ref: `#/components/schemas/${endpoint.success.schemaName}` } } } } : {}),
      },
    };

    for (const error of endpoint.errors) {
      responses[error.status] = {
        description: error.description,
        headers: responseHeaders({ ...endpoint.success, headers: error.headers ?? endpoint.success.headers }),
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
        },
      };
    }

    const operation: Record<string, unknown> = {
        operationId: endpoint.operationId,
        summary: endpoint.summary,
        responses,
    };
    if (endpoint.request) {
      operation.requestBody = { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${endpoint.request.schemaName}` } } } };
    }
    const parameters = [
      ...(endpoint.pathParameters ?? []).map((parameter) => ({
        name: parameter.name, in: "path", required: true, description: parameter.description, schema: schemaFor(parameter.schema),
      })),
      ...(endpoint.requestHeaders ?? []).map((header) => ({
        name: header.name, in: "header", required: header.required, description: header.description, schema: schemaFor(header.schema),
      })),
    ];
    if (parameters.length > 0) operation.parameters = parameters;
    if (endpoint.security) operation.security = endpoint.security.map((name) => ({ [name]: [] }));
    paths[endpoint.path] = { ...(paths[endpoint.path] as Record<string, unknown> | undefined), [endpoint.method]: operation };
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
        ...componentHeaders,
      },
      securitySchemes: { cookieAuth: { type: "apiKey", in: "cookie", name: "raahsathi_session" } },
      schemas: { ApiError: schemaFor(apiErrorSchema), ...requestSchemas, ...successSchemas },
    },
  };
}

export function serializeOpenApiDocument(): string {
  return `${JSON.stringify(createOpenApiDocument(), null, 2)}\n`;
}
