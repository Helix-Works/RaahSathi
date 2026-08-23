import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { acquireAuthTransactionLock } from "./auth-service";
import { isDisposableDatabaseApproved } from "./database-test-safety";

const testUrl = process.env.TEST_DATABASE_URL;
const safeTestUrl = isDisposableDatabaseApproved({
  testDatabaseUrl: testUrl,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if (testUrl && process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION && !safeTestUrl) {
  throw new Error("Refusing database tests: disposable database identity is invalid or matches DATABASE_URL.");
}
const database = safeTestUrl ? new PrismaClient({ datasourceUrl: testUrl }) : undefined;

describe.skipIf(!database)("Phase 1 disposable PostgreSQL persistence", () => {
  const applicantId = randomUUID();
  const sessionId = randomUUID();

  afterAll(async () => {
    if (!database) return;
    await database.session.deleteMany({ where: { applicantId } });
    await database.auditEvent.deleteMany({ where: { actorApplicantId: applicantId } });
    await database.authAttempt.deleteMany({ where: { applicantId } });
    await database.applicant.deleteMany({ where: { id: applicantId } });
    await database.$disconnect();
  });

  it("acquires the transaction-scoped auth advisory lock through a deserializable result", async () => {
    if (!database) return;

    await expect(database.$transaction(async (transaction) => {
      await acquireAuthTransactionLock(transaction, `auth-lock-${applicantId}`);
    })).resolves.toBeUndefined();
  });

  it("persists and revokes an opaque session across clients", async () => {
    if (!database) return;
    await database.applicant.create({
      data: { id: applicantId, mobileLookupHash: `test-${applicantId}`, mobileLast4: "0000", displayName: "Disposable Test" },
    });
    await database.session.create({
      data: {
        id: sessionId,
        applicantId,
        tokenHash: `token-${applicantId}`,
        csrfSecretHash: `csrf-${applicantId}`,
        idleExpiresAt: new Date(Date.now() + 60_000),
        absoluteExpiresAt: new Date(Date.now() + 120_000),
      },
    });
    const secondClient = new PrismaClient({ datasourceUrl: testUrl });
    try {
      await secondClient.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
    } finally {
      await secondClient.$disconnect();
    }
    expect((await database.session.findUniqueOrThrow({ where: { id: sessionId } })).revokedAt).toBeInstanceOf(Date);
  });
});
