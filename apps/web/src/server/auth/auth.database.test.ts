import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

const testUrl = process.env.TEST_DATABASE_URL;
const safeTestUrl = (() => {
  if (!testUrl) return false;
  try {
    return /test|ci|ephemeral/i.test(new URL(testUrl).pathname) && testUrl !== process.env.DATABASE_URL;
  } catch {
    return false;
  }
})();
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
    await secondClient.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
    await secondClient.$disconnect();
    expect((await database.session.findUniqueOrThrow({ where: { id: sessionId } })).revokedAt).toBeInstanceOf(Date);
  });
});
