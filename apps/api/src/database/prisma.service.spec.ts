import { PrismaService } from "./prisma.service";

describe("PrismaService", () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("connects when its NestJS module initializes", async () => {
    const connect = jest.spyOn(service, "$connect").mockResolvedValue();

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("disconnects when its NestJS module is destroyed", async () => {
    const disconnect = jest.spyOn(service, "$disconnect").mockResolvedValue();

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("propagates a connection failure for startup handling", async () => {
    jest.spyOn(service, "$connect").mockRejectedValue(new Error("connection failed"));

    await expect(service.onModuleInit()).rejects.toThrow("connection failed");
  });
});
