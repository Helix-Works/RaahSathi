import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { readinessEndpointContract } from "../contracts/health";
import { createOpenApiDocument, serializeOpenApiDocument } from "./document";

describe("OpenAPI", () => {
  it("documents health, readiness, and shared errors", () => {
    const document = createOpenApiDocument();
    expect(document).toMatchObject({
      openapi: "3.1.0",
      paths: {
        "/api/v1/health": {},
        "/api/v1/health/ready": {
          get: {
            responses: {
              200: { headers: { "x-request-id": { $ref: "#/components/headers/RequestId" } } },
              503: { headers: { "x-request-id": { $ref: "#/components/headers/RequestId" } } },
            },
          },
        },
      },
      components: { headers: { RequestId: {} } },
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
    expect(committed).toBe(serializeOpenApiDocument());
  });
});
