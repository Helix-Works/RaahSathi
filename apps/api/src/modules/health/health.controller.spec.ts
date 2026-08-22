import { Test } from "@nestjs/testing";
import { ServiceUnavailableException } from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;
  const prisma = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  afterEach(() => {
    prisma.$queryRaw.mockReset();
  });

  it("reports an ok status", () => {
    expect(controller.check()).toEqual({ status: "ok" });
  });

  it("reports ready when PostgreSQL responds", async () => {
    prisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    await expect(controller.ready()).resolves.toEqual({ status: "ready", database: "up" });
  });

  it("reports a service-unavailable exception when PostgreSQL fails", async () => {
    prisma.$queryRaw.mockRejectedValue(new Error("database unavailable"));

    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
