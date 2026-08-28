import { randomUUID } from "node:crypto";

import { applicationListSchema } from "@raahsathi/contracts/applications";
import { afterAll, describe, expect, it } from "vitest";

import { isDisposableDatabaseApproved } from "@/server/auth/database-test-safety";
import {
  createApplication,
  getApplication,
  listApplications,
  saveApplicationSection,
} from "@/server/applications/application-service";
import { createDatabaseTestClient } from "@/server/database/database-test-client";

const testUrl = process.env.TEST_DATABASE_URL;
const approved = isDisposableDatabaseApproved({
  testDatabaseUrl: testUrl,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if ((testUrl || process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION) && !approved) {
  throw new Error("Refusing Phase 2 database tests: database identities are not safely distinct.");
}
const database = approved ? createDatabaseTestClient(testUrl) : undefined;

describe.skipIf(!database)("Phase 2 disposable PostgreSQL persistence", () => {
  const applicantA = randomUUID();
  const applicantB = randomUUID();
  const applicationId = randomUUID();
  const permanentLicenceId = randomUUID();
  const contextA = { sessionId: randomUUID(), applicantId: applicantA };
  const contextB = { sessionId: randomUUID(), applicantId: applicantB };

  afterAll(async () => {
    if (!database) return;
    try {
      await database.application.deleteMany({ where: { applicantId: { in: [applicantA, applicantB] } } });
      await database.licenceRecord.deleteMany({ where: { id: permanentLicenceId } });
      await database.applicant.deleteMany({ where: { id: { in: [applicantA, applicantB] } } });
    } finally {
      await database.$disconnect();
    }
  });

  it("persists a saved section and immutable history across Prisma clients while owner scoping excludes another applicant", async () => {
    if (!database) return;
    await database.applicant.createMany({ data: [
      { id: applicantA, mobileLookupHash: `phase2-${applicantA}`, mobileLast4: "0000", displayName: "Phase 2 A" },
      { id: applicantB, mobileLookupHash: `phase2-${applicantB}`, mobileLast4: "0001", displayName: "Phase 2 B" },
    ] });
    await database.application.create({ data: {
      id: applicationId, applicantId: applicantA, serviceKey: "LEARNER_LICENCE",
      sections: { create: { sectionKey: "PERSONAL_DETAILS", data: { fullName: "Synthetic A", dateOfBirth: "1995-01-15" } } },
      events: { create: { actorApplicantId: applicantA, eventType: "APPLICATION_CREATED", correlationId: "phase2-db-test" } },
    } });
    const restarted = createDatabaseTestClient(testUrl);
    try {
      const resumed = await restarted.application.findFirst({ where: { id: applicationId, applicantId: applicantA }, include: { sections: true, events: true } });
      expect(resumed?.sections).toHaveLength(1);
      expect(resumed?.events.map((event) => event.eventType)).toEqual(["APPLICATION_CREATED"]);
      expect(await restarted.application.findFirst({ where: { id: applicationId, applicantId: applicantB } })).toBeNull();

      const applications = await listApplications(contextA, restarted);
      expect(applicationListSchema.parse({ applications }).applications).toHaveLength(1);
      expect(applications[0]).not.toHaveProperty("sections");
      expect(applications[0]).not.toHaveProperty("history");

      const detail = await getApplication(contextA, applicationId, restarted);
      expect(detail.sections).toHaveLength(1);
      expect(detail.history.map((event) => event.eventType)).toEqual(["APPLICATION_CREATED"]);
    } finally {
      await restarted.$disconnect();
    }
  });

  it("requires an owned permanent licence and rejects a no-op address change", async () => {
    if (!database) return;
    await database.licenceRecord.create({ data: {
      id: permanentLicenceId,
      applicantId: applicantA,
      kind: "PERMANENT",
      syntheticReference: `SYN-DL-${permanentLicenceId.toUpperCase()}`,
      vehicleClass: "LMV",
      issuedAt: new Date("2025-01-01T00:00:00.000Z"),
      validUntil: new Date("2030-01-01T00:00:00.000Z"),
      addressDistrict: "CENTRAL",
      addressPostalCode: "110001",
    } });

    const renewal = await createApplication(
      contextA,
      "DRIVING_LICENCE_RENEWAL",
      "phase8-renewal-create",
      database,
    );
    expect(renewal.targetLicenceId).toBe(permanentLicenceId);
    await expect(createApplication(
      contextB,
      "DRIVING_LICENCE_RENEWAL",
      "phase8-renewal-ineligible",
      database,
    )).rejects.toThrowError(/ELIGIBLE_LICENCE_REQUIRED/);
    await expect(database.application.create({ data: {
      applicantId: applicantB,
      serviceKey: "DRIVING_LICENCE_RENEWAL",
      targetLicenceId: permanentLicenceId,
    } })).rejects.toMatchObject({ code: "P2003" });

    const addressChange = await createApplication(
      contextA,
      "DRIVING_LICENCE_ADDRESS_CHANGE",
      "phase8-address-create",
      database,
    );
    await expect(saveApplicationSection(contextA, {
      applicationId: addressChange.id,
      sectionKey: "ADDRESS",
      expectedRevision: 0,
      data: { district: "CENTRAL", postalCode: "110001" },
      correlationId: "phase8-address-unchanged",
    }, database)).rejects.toThrowError(/ADDRESS_UNCHANGED/);
    expect(await database.applicationSection.count({ where: { applicationId: addressChange.id } })).toBe(0);
  });
});
