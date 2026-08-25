import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const transaction = vi.hoisted(() => vi.fn());

vi.mock("@/server/config/environment", () => ({
  getServerEnvironment: () => ({
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://synthetic:synthetic@localhost/synthetic",
    AUTH_MOBILE_LOOKUP_PEPPER: "synthetic-mobile-lookup-pepper-32-characters",
    AUTH_OTP_PEPPER: "synthetic-otp-pepper-at-least-32-characters",
    AUTH_DEMO_OTP: "123456",
    PAYMENT_PROVIDER_WEBHOOK_SECRET: "synthetic-payment-secret-at-least-32-characters",
  }),
}));

vi.mock("@/server/database/prisma", () => ({
  prisma: { $transaction: transaction },
}));

import { authPolicy } from "./auth-policy";
import { requestOtp } from "./auth-service";

const now = new Date("2026-08-25T12:00:00.000Z");
const attemptId = "10000000-0000-4000-8000-000000000001";
const applicantId = "20000000-0000-4000-8000-000000000001";

function transactionDatabase(input: Readonly<{
  latest?: Readonly<{
    id: string;
    applicantId: string | null;
    resendAvailableAt: Date;
  }> | null;
  recentAttempts?: readonly Readonly<{ createdAt: Date }>[];
}> = {}) {
  return {
    $queryRaw: vi.fn().mockResolvedValue([{ pg_advisory_xact_lock: "" }]),
    authAttempt: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      findFirst: vi.fn().mockResolvedValue(input.latest ?? null),
      findMany: vi.fn().mockResolvedValue(input.recentAttempts ?? []),
      create: vi.fn().mockResolvedValue({ id: attemptId }),
    },
    applicant: {
      findUnique: vi.fn().mockResolvedValue({ id: applicantId, authScenario: "STANDARD" }),
    },
    auditEvent: {
      create: vi.fn().mockResolvedValue({ id: crypto.randomUUID() }),
    },
  };
}

describe("OTP request transaction acquisition", () => {
  beforeEach(() => {
    transaction.mockReset();
  });

  it("uses only a 15-second maxWait while preserving issuance and advisory-lock behavior", async () => {
    const database = transactionDatabase();
    transaction.mockImplementationOnce(async (callback: (client: Prisma.TransactionClient) => Promise<unknown>) => (
      callback(database as unknown as Prisma.TransactionClient)
    ));

    await expect(requestOtp("9000000000", "auth-max-wait", now)).resolves.toEqual({
      challengeId: attemptId,
      maskedDestination: "••••••0000",
      expiresAt: new Date(now.getTime() + authPolicy.otpLifetimeMs).toISOString(),
      resendAvailableAt: new Date(now.getTime() + authPolicy.resendCooldownMs).toISOString(),
    });

    expect(transaction).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { maxWait: 15_000 });
    expect(database.$queryRaw).toHaveBeenCalledOnce();
    expect(database.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      database.authAttempt.updateMany.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
    expect(database.authAttempt.create).toHaveBeenCalledOnce();
    expect(database.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "AUTH_OTP_REQUESTED",
        resourceId: attemptId,
        correlationId: "auth-max-wait",
      }),
    });
  });

  it("preserves resend cooldown without creating another AuthAttempt", async () => {
    const database = transactionDatabase({
      latest: {
        id: attemptId,
        applicantId,
        resendAvailableAt: new Date(now.getTime() + 30_000),
      },
      recentAttempts: [{ createdAt: new Date(now.getTime() - 60_000) }],
    });
    transaction.mockImplementationOnce(async (callback: (client: Prisma.TransactionClient) => Promise<unknown>) => (
      callback(database as unknown as Prisma.TransactionClient)
    ));

    await expect(requestOtp("9000000000", "auth-cooldown", now)).rejects.toMatchObject({
      code: "AUTH_RATE_LIMITED",
    });

    expect(transaction).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { maxWait: 15_000 });
    expect(database.$queryRaw).toHaveBeenCalledOnce();
    expect(database.authAttempt.create).not.toHaveBeenCalled();
    expect(database.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "AUTH_RATE_LIMITED",
        resourceId: attemptId,
        correlationId: "auth-cooldown",
        metadata: { reasonCode: "COOLDOWN" },
      }),
    });
  });

  it("preserves the request-window limit without creating another AuthAttempt", async () => {
    const database = transactionDatabase({
      latest: {
        id: attemptId,
        applicantId,
        resendAvailableAt: new Date(now.getTime() - 1_000),
      },
      recentAttempts: [
        { createdAt: new Date(now.getTime() - 120_000) },
        { createdAt: new Date(now.getTime() - 60_000) },
        { createdAt: new Date(now.getTime() - 30_000) },
      ],
    });
    transaction.mockImplementationOnce(async (callback: (client: Prisma.TransactionClient) => Promise<unknown>) => (
      callback(database as unknown as Prisma.TransactionClient)
    ));

    await expect(requestOtp("9000000000", "auth-window-limit", now)).rejects.toMatchObject({
      code: "AUTH_RATE_LIMITED",
    });

    expect(transaction).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { maxWait: 15_000 });
    expect(database.$queryRaw).toHaveBeenCalledOnce();
    expect(database.authAttempt.create).not.toHaveBeenCalled();
    expect(database.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "AUTH_RATE_LIMITED",
        resourceId: attemptId,
        correlationId: "auth-window-limit",
        metadata: { reasonCode: "WINDOW" },
      }),
    });
  });

  it("propagates P2028 without retrying the transaction", async () => {
    const transactionError = new Prisma.PrismaClientKnownRequestError(
      "Transaction API error: Unable to start a transaction in the given time.",
      {
        code: "P2028",
        clientVersion: Prisma.prismaVersion.client,
        meta: { error: "Unable to start a transaction in the given time." },
      },
    );
    transaction.mockRejectedValueOnce(transactionError);

    await expect(requestOtp("9000000000", "auth-p2028", now)).rejects.toBe(transactionError);
    expect(transaction).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { maxWait: 15_000 });
  });
});
