import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { createOpenApiDocument, serializeOpenApiDocument } from "./document";

describe("OpenAPI", () => {
  it("documents health, readiness, and shared errors", () => {
    const document = createOpenApiDocument();
    expect(document).toMatchObject({ openapi: "3.1.0", paths: { "/api/v1/health": {}, "/api/v1/health/ready": {} } });
  });

  it("matches the committed generated artifact", async () => {
    const committed = await readFile(resolve(process.cwd(), "../../docs/api/openapi.json"), "utf8");
    expect(committed).toBe(serializeOpenApiDocument());
  });
});
