import { Body, Controller, Post } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { IsString } from "class-validator";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/configure-application";
import { PrismaService } from "../src/database/prisma.service";

class TestPayloadDto {
  @IsString()
  name!: string;
}

@Controller("_test")
class TestController {
  @Post()
  accept(@Body() payload: TestPayloadDto): TestPayloadDto {
    return payload;
  }
}

describe("Health API (e2e)", () => {
  let app: INestApplication;
  const queryRaw = jest.fn();

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestController],
    })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn(), $queryRaw: queryRaw })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  beforeEach(() => {
    queryRaw.mockReset().mockResolvedValue([{ "?column?": 1 }]);
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/health", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200)
      .expect({ status: "ok" });

    expect(response.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("GET /api/v1/health/ready reports PostgreSQL readiness", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/health/ready")
      .expect(200)
      .expect({ status: "ready", database: "up" });

    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it("GET /api/v1/health/ready hides PostgreSQL failures", async () => {
    queryRaw.mockRejectedValueOnce(
      new Error("password=do-not-leak host=private-database.invalid"),
    );

    const response = await request(app.getHttpServer())
      .get("/api/v1/health/ready")
      .set("x-request-id", "demo-readiness-failure")
      .expect(503)
      .expect({
        error: {
          code: "DEPENDENCY_UNAVAILABLE",
          messageKey: "errors.dependencyUnavailable",
          correlationId: "demo-readiness-failure",
        },
      });

    expect(JSON.stringify(response.body)).not.toContain("do-not-leak");
    expect(JSON.stringify(response.body)).not.toContain("private-database.invalid");
  });

  it("preserves a safe caller correlation ID", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/health")
      .set("x-request-id", "demo-request-123")
      .expect(200);

    expect(response.headers["x-request-id"]).toBe("demo-request-123");
  });

  it("replaces an unsafe caller correlation ID", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/health")
      .set("x-request-id", "unsafe request id")
      .expect(200);

    expect(response.headers["x-request-id"]).not.toBe("unsafe request id");
    expect(response.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("allows credentialed CORS only for the configured exact origin", async () => {
    const allowed = await request(app.getHttpServer())
      .options("/api/v1/health")
      .set("origin", "http://localhost:3000")
      .set("access-control-request-method", "GET")
      .expect(204);

    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");

    const rejected = await request(app.getHttpServer())
      .options("/api/v1/health")
      .set("origin", "https://attacker.invalid")
      .set("access-control-request-method", "GET")
      .expect(404);

    expect(rejected.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("returns a safe error envelope for unknown routes", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/not-found")
      .set("x-request-id", "demo-request-404")
      .expect(404)
      .expect({
        error: {
          code: "RESOURCE_NOT_FOUND",
          messageKey: "errors.resourceNotFound",
          correlationId: "demo-request-404",
        },
      });
  });

  it("rejects malformed and unexpected DTO fields safely", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/_test")
      .set("x-request-id", "demo-request-validation")
      .send({ name: 123, unexpected: true })
      .expect(400)
      .expect({
        error: {
          code: "VALIDATION_FAILED",
          messageKey: "errors.validationFailed",
          correlationId: "demo-request-validation",
        },
      });
  });
});
