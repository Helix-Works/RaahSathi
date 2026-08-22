import { Body, Controller, Post } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { IsString } from "class-validator";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/configure-application";

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

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
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
