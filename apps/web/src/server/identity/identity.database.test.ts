import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { seedSyntheticApplication } from "../../../prisma/seed-application";

import { isDisposableDatabaseApproved } from "@/server/auth/database-test-safety";
import { createDatabaseTestClient } from "@/server/database/database-test-client";
import { getIdentityContext, retryIdentityAttempt, startIdentityAttempt } from "@/server/identity/identity-service";
import { getLicence } from "@/server/licences/licence-service";

const testUrl = process.env.TEST_DATABASE_URL;
const approved = isDisposableDatabaseApproved({
  testDatabaseUrl: testUrl,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if ((testUrl || process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION) && !approved) {
  throw new Error("Refusing Phase 3 database tests: database identities are not safely distinct.");
}
const database = approved ? createDatabaseTestClient(testUrl) : undefined;

describe.skipIf(!database)("Phase 3 disposable PostgreSQL identity recovery", () => {
  const applicantA = randomUUID();
  const applicantB = randomUUID();
  const applicationId = randomUUID();
  const licenceId = randomUUID();
  const contextA = { sessionId: randomUUID(), applicantId: applicantA };
  const contextB = { sessionId: randomUUID(), applicantId: applicantB };

  afterAll(async () => {
    if (!database) return;
    try {
      await database.application.deleteMany({ where: { id: applicationId } });
      await database.licenceRecord.deleteMany({ where: { id: licenceId } });
      await database.applicant.deleteMany({ where: { id: { in: [applicantA, applicantB] } } });
    } finally {
      await database.$disconnect();
    }
  });

  it("preserves completed progress through provider failure and advances exactly once after safe retry", async () => {
    if (!database) return;
    await database.applicant.createMany({ data: [
      { id: applicantA, mobileLookupHash: `phase3-${applicantA}`, mobileLast4: "0000", displayName: "Phase 3 A" },
      { id: applicantB, mobileLookupHash: `phase3-${applicantB}`, mobileLast4: "0001", displayName: "Phase 3 B" },
    ] });
    await database.application.create({ data: {
      id: applicationId,
      applicantId: applicantA,
      serviceKey: "LEARNER_LICENCE",
      status: "READY_FOR_IDENTITY",
      identityScenario: "SUCCESS",
      sections: { create: [
        { sectionKey: "PERSONAL_DETAILS", data: { fullName: "Synthetic A", dateOfBirth: "1995-01-15" }, completedAt: new Date() },
        { sectionKey: "ADDRESS", data: { district: "CENTRAL", postalCode: "110001" }, completedAt: new Date() },
        { sectionKey: "SERVICE_DETAILS", data: { vehicleClass: "LMV" }, completedAt: new Date() },
        { sectionKey: "DECLARATION", data: { accepted: true }, completedAt: new Date() },
      ] },
      events: { create: {
        actorApplicantId: applicantA,
        eventType: "APPLICATION_CREATED",
        correlationId: "phase3-db-test",
      } },
    } });
    await database.licenceRecord.create({ data: {
      id: licenceId, applicantId: applicantA, kind: "LEARNER", syntheticReference: `SYN-LL-${licenceId.toUpperCase()}`,
      vehicleClass: "LMV", issuedAt: new Date("2026-01-01T00:00:00.000Z"), validUntil: new Date("2026-12-31T00:00:00.000Z"),
    } });

    const eventCountBeforeSeedRerun = await database.applicationEvent.count({ where: { applicationId } });
    await seedSyntheticApplication(database, applicantA);
    const applicationAfterSeedRerun = await database.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { sections: true },
    });
    expect(applicationAfterSeedRerun.identityScenario).toBe("PROVIDER_UNAVAILABLE");
    expect(applicationAfterSeedRerun.status).toBe("READY_FOR_IDENTITY");
    expect(applicationAfterSeedRerun.sections).toHaveLength(4);
    expect(applicationAfterSeedRerun.sections.find(({ sectionKey }) => sectionKey === "PERSONAL_DETAILS")?.data)
      .toEqual({ fullName: "Aditi Sharma", dateOfBirth: "1995-01-15" });
    expect(await database.applicationEvent.count({ where: { applicationId } })).toBe(eventCountBeforeSeedRerun);

    const [failed, duplicateStart] = await Promise.all([
      startIdentityAttempt(contextA, { applicationId, correlationId: "phase3-start-a" }, database),
      startIdentityAttempt(contextA, { applicationId, correlationId: "phase3-start-b" }, database),
    ]);
    expect(failed.attempt?.outcome).toBe("PROVIDER_UNAVAILABLE");
    expect(duplicateStart.attempt?.id).toBe(failed.attempt?.id);
    expect(await database.identityAttempt.count({ where: { applicationId } })).toBe(1);
    expect(await database.applicationSection.count({ where: { applicationId, completedAt: { not: null } } })).toBe(4);
    expect((await database.application.findUniqueOrThrow({ where: { id: applicationId } })).status).toBe("READY_FOR_IDENTITY");

    const [verified, duplicate] = await Promise.all([
      retryIdentityAttempt(contextA, {
        applicationId, attemptId: failed.attempt?.id ?? "", correlationId: "phase3-retry-a",
      }, database),
      retryIdentityAttempt(contextA, {
        applicationId, attemptId: failed.attempt?.id ?? "", correlationId: "phase3-retry-b",
      }, database),
    ]);
    expect(verified.attempt?.outcome).toBe("VERIFIED");
    expect(duplicate.attempt?.id).toBe(verified.attempt?.id);
    expect(await database.identityAttempt.count({ where: { applicationId } })).toBe(2);
    expect(await database.applicationEvent.count({ where: { applicationId, eventType: "IDENTITY_VERIFIED" } })).toBe(1);
    expect((await database.application.findUniqueOrThrow({ where: { id: applicationId } })).status).toBe("READY_FOR_PAYMENT");

    expect((await getLicence(contextA, licenceId, database)).id).toBe(licenceId);
    await expect(getIdentityContext(contextB, applicationId, database)).rejects.toThrowError(/RESOURCE_NOT_FOUND/);
    await expect(getLicence(contextB, licenceId, database)).rejects.toThrowError(/RESOURCE_NOT_FOUND/);
  });
});
