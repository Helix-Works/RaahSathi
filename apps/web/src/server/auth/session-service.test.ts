import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/database/prisma", () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/database/prisma";

import { sessionCookieName } from "./cookies";
import { resolveSessionFromCookie } from "./session-service";

function connectionClosedError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Server has closed the connection.", {
    code: "P1017",
    clientVersion: Prisma.prismaVersion.client,
  });
}

const now = new Date("2026-08-25T12:00:00.000Z");
const applicantId = "10000000-0000-4000-8000-000000000001";
const sessionRecord = {
  id: "20000000-0000-4000-8000-000000000001",
  applicantId,
  tokenHash: "synthetic-token-hash",
  csrfSecretHash: "synthetic-csrf-hash",
  createdAt: new Date("2026-08-25T11:00:00.000Z"),
  lastSeenAt: now,
  idleExpiresAt: new Date("2026-08-25T13:00:00.000Z"),
  absoluteExpiresAt: new Date("2026-08-26T12:00:00.000Z"),
  revokedAt: null,
  applicant: {
    id: applicantId,
    mobileLookupHash: "synthetic-mobile-lookup-hash",
    mobileLast4: "0001",
    displayName: "Synthetic Applicant",
    authScenario: "STANDARD" as const,
    preferredLocale: "EN" as const,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
  },
};

describe("session reconstruction read recovery", () => {
  const findUnique = vi.mocked(prisma.session.findUnique);

  beforeEach(() => {
    findUnique.mockReset();
  });

  it("resolves the authenticated session after one P1017 read failure", async () => {
    findUnique
      .mockRejectedValueOnce(connectionClosedError())
      .mockResolvedValueOnce(sessionRecord);

    await expect(resolveSessionFromCookie(
      `${sessionCookieName}=synthetic-session-token`,
      { now, touch: false },
    )).resolves.toMatchObject({
      kind: "authenticated",
      context: { applicantId },
      user: { displayName: "Synthetic Applicant", preferredLocale: "en" },
    });
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it("propagates a second P1017 instead of treating the session as anonymous", async () => {
    const secondError = connectionClosedError();
    findUnique
      .mockRejectedValueOnce(connectionClosedError())
      .mockRejectedValueOnce(secondError);

    await expect(resolveSessionFromCookie(
      `${sessionCookieName}=synthetic-session-token`,
      { now, touch: false },
    )).rejects.toBe(secondError);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it("returns anonymous only after a successful read establishes absence", async () => {
    findUnique.mockResolvedValueOnce(null);

    await expect(resolveSessionFromCookie(
      `${sessionCookieName}=synthetic-session-token`,
      { now, touch: false },
    )).resolves.toEqual({ kind: "anonymous" });
    expect(findUnique).toHaveBeenCalledTimes(1);
  });
});
