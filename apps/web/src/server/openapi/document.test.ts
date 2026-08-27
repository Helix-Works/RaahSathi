import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { readinessEndpointContract } from "../contracts/health";
import { createOpenApiDocument, normalizeOpenApiLineEndings, serializeOpenApiDocument } from "./document";

describe("OpenAPI", () => {
  it("documents health, readiness, authentication, and shared errors", () => {
    const document = createOpenApiDocument();
    expect(document).toMatchObject({
      openapi: "3.1.0",
      paths: {
        "/api/v1/health": {},
        "/api/v1/auth/request-otp": { post: { responses: { 202: {}, 429: {} } } },
        "/api/v1/auth/verify-otp": { post: { responses: { 200: {} } } },
        "/api/v1/auth/logout": { post: { responses: { 204: {} }, security: [{ cookieAuth: [] }] } },
        "/api/v1/me": { get: { responses: { 200: {}, 401: {} }, security: [{ cookieAuth: [] }] } },
        "/api/v1/applications": { get: { responses: { 200: {} } }, post: { responses: { 201: {}, 403: {} } } },
        "/api/v1/applications/{id}/sections/{sectionKey}": {
          patch: { parameters: [{ name: "id", in: "path" }, { name: "sectionKey", in: "path" }] },
        },
        "/api/v1/applications/{id}/identity-attempts": { post: { responses: { 200: {}, 409: {} } } },
        "/api/v1/applications/{id}/identity-attempts/latest": { get: { responses: { 200: {}, 404: {} } } },
        "/api/v1/applications/{id}/identity-attempts/{attemptId}/retry": { post: { responses: { 200: {}, 409: {} } } },
        "/api/v1/licences": { get: { responses: { 200: {}, 401: {} } } },
        "/api/v1/licences/{id}": { get: { responses: { 200: {}, 404: {} } } },
        "/api/v1/applications/{id}/payments": { post: { responses: { 200: {}, 409: {} } } },
        "/api/v1/payments/{id}": { get: { responses: { 200: {}, 404: {} } } },
        "/api/v1/payment-provider/events": {
          post: {
            responses: { 200: {}, 400: {} },
            security: [{ providerSignatureAuth: [] }],
            parameters: [{
              name: "x-raahsathi-provider-signature",
              in: "header",
              required: true,
              schema: { type: "string", pattern: "^sha256=[0-9a-f]{64}$" },
            }],
          },
        },
        "/api/v1/rtos": { get: { responses: { 200: {} } } },
        "/api/v1/rtos/{id}/availability": {
          get: { parameters: [
            { name: "id", in: "path", required: true },
            { name: "month", in: "query", required: true },
            { name: "service", in: "query", required: true },
          ] },
        },
        "/api/v1/rtos/{id}/slots": { get: { responses: { 200: {}, 404: {} } } },
        "/api/v1/appointments": {
          get: { responses: { 200: {}, 401: {} } },
          post: { responses: { 201: {}, 409: {}, 429: {} }, security: [{ cookieAuth: [] }] },
        },
        "/api/v1/appointments/{id}/cancel": { post: { responses: { 200: {}, 409: {} } } },
        "/api/v1/waitlist": { get: { responses: { 200: {}, 400: {}, 401: {}, 500: {} } } },
        "/api/v1/waitlist/process": { post: { responses: { 204: {}, 401: {}, 403: {}, 413: {}, 415: {} }, security: [{ cookieAuth: [] }] } },
        "/api/v1/health/ready": {
          get: {
            responses: {
              200: { headers: { "x-request-id": { $ref: "#/components/headers/RequestId" } } },
              503: { headers: { "x-request-id": { $ref: "#/components/headers/RequestId" } } },
            },
          },
        },
      },
      components: {
        headers: { RequestId: {} },
        securitySchemes: {
          providerSignatureAuth: {
            type: "apiKey",
            in: "header",
            name: "x-raahsathi-provider-signature",
          },
        },
      },
    });
  });

  it("uses the runtime readiness schema as the documented response contract", () => {
    expect(readinessEndpointContract.success.schema.parse({ status: "ready", database: "up" }))
      .toEqual({ status: "ready", database: "up" });
    expect(() => readinessEndpointContract.success.schema.parse({ status: "degraded", database: "up" }))
      .toThrow();
  });

  it("matches the committed generated artifact", async () => {
    const committed = await readFile(resolve(process.cwd(), "../../docs/api/openapi.json"), "utf8");
    expect(normalizeOpenApiLineEndings(committed)).toBe(serializeOpenApiDocument());
  });

  it("compares generated artifacts independently of Git working-tree line endings", () => {
    expect(normalizeOpenApiLineEndings("one\r\ntwo\r\n")).toBe("one\ntwo\n");
  });
});
