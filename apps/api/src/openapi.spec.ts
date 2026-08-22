import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { AppModule } from "./app.module";
import { configureApplication } from "./configure-application";
import { PrismaService } from "./database/prisma.service";
import { createOpenApiDocument } from "./openapi";

describe("OpenAPI document", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn(), $queryRaw: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("describes only the implemented versioned health operations", () => {
    const document = createOpenApiDocument(app);

    expect(document.paths).toHaveProperty("/api/v1/health");
    expect(document.paths).toHaveProperty("/api/v1/health/ready");
    expect(Object.keys(document.paths)).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("/auth"),
        expect.stringContaining("/applications"),
      ]),
    );
  });

  it("describes readiness success and the safe dependency error envelope", () => {
    const operation = createOpenApiDocument(app).paths["/api/v1/health/ready"]?.get;

    expect(operation?.responses).toHaveProperty("200");
    expect(operation?.responses).toHaveProperty("503");
    expect(createOpenApiDocument(app).components?.schemas).toHaveProperty("ApiErrorDto");
  });

  it("is deterministic for the same application metadata", () => {
    expect(createOpenApiDocument(app)).toEqual(createOpenApiDocument(app));
  });

  it("matches the committed OpenAPI artifact", async () => {
    const artifactPath = resolve(__dirname, "../../..", "docs/api/openapi.json");
    const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as unknown;

    expect(artifact).toEqual(createOpenApiDocument(app));
  });
});
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
