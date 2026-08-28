import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { createDatabaseTestClient } from "./database-test-client";
import { isDisposableDatabaseApproved } from "../auth/database-test-safety";

const testUrl = process.env.TEST_DATABASE_URL;
const safeTestUrl = isDisposableDatabaseApproved({
  testDatabaseUrl: testUrl,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if (testUrl && process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION && !safeTestUrl) {
  throw new Error("Refusing database tests: disposable database identity is invalid or matches DATABASE_URL.");
}
const database = safeTestUrl ? createDatabaseTestClient(testUrl) : undefined;

describe.skipIf(!database)("Neon database roundtrip integration", () => {
  const applicantId = randomUUID();
  const duplicateHash = `dup-test-${randomUUID()}`;

  afterAll(async () => {
    if (!database) return;
    try {
      await database.applicant.deleteMany({ where: { mobileLookupHash: duplicateHash } });
      await database.session.deleteMany({ where: { applicantId } });
      await database.auditEvent.deleteMany({ where: { actorApplicantId: applicantId } });
      await database.authAttempt.deleteMany({ where: { applicantId } });
      await database.applicant.deleteMany({ where: { id: applicantId } });
    } finally {
      await database.$disconnect();
    }
  });

  it("inserts a mock Applicant, reads it back, and verifies correctness", async () => {
    if (!database) return;

    const mobileLookupHash = `roundtrip-test-${applicantId}`;
    const mobileLast4 = "9999";
    const displayName = "Roundtrip Test User";

    const created = await database.applicant.create({
      data: {
        id: applicantId,
        mobileLookupHash,
        mobileLast4,
        displayName,
      },
    });

    expect(created).toBeDefined();
    expect(created.id).toBe(applicantId);
    expect(created.mobileLookupHash).toBe(mobileLookupHash);
    expect(created.mobileLast4).toBe(mobileLast4);
    expect(created.displayName).toBe(displayName);
    expect(created.preferredLocale).toBe("EN");
    expect(created.createdAt).toBeInstanceOf(Date);

    const found = await database.applicant.findUniqueOrThrow({
      where: { id: applicantId },
    });

    expect(found.id).toBe(created.id);
    expect(found.mobileLookupHash).toBe(mobileLookupHash);
    expect(found.mobileLast4).toBe(mobileLast4);
    expect(found.displayName).toBe(displayName);
    expect(found.updatedAt).toBeInstanceOf(Date);
  });

  it("enforces unique constraint on mobileLookupHash", async () => {
    if (!database) return;

    await database.applicant.create({
      data: {
        mobileLookupHash: duplicateHash,
        mobileLast4: "1111",
        displayName: "First",
      },
    });

    await expect(
      database.applicant.create({
        data: {
          mobileLookupHash: duplicateHash,
          mobileLast4: "2222",
          displayName: "Second",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("returns null for a nonexistent id", async () => {
    if (!database) return;

    const result = await database.applicant.findUnique({
      where: { id: "00000000-0000-0000-0000-000000000000" },
    });

    expect(result).toBeNull();
  });
});
