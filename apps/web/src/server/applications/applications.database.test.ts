import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { applicationListSchema } from "@raahsathi/contracts/applications";
import { afterAll, describe, expect, it } from "vitest";

import { isDisposableDatabaseApproved } from "@/server/auth/database-test-safety";
import { getApplication, listApplications } from "@/server/applications/application-service";

const testUrl = process.env.TEST_DATABASE_URL;
const approved = isDisposableDatabaseApproved({
  testDatabaseUrl: testUrl,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if ((testUrl || process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION) && !approved) {
  throw new Error("Refusing Phase 2 database tests: database identities are not safely distinct.");
}
const database = approved ? new PrismaClient({ datasourceUrl: testUrl }) : undefined;

describe.skipIf(!database)("Phase 2 disposable PostgreSQL persistence", () => {
  const applicantA = randomUUID();
  const applicantB = randomUUID();
  const applicationId = randomUUID();
  const contextA = { sessionId: randomUUID(), applicantId: applicantA };

  afterAll(async () => {
    if (!database) return;
    await database.application.deleteMany({ where: { id: applicationId } });
    await database.applicant.deleteMany({ where: { id: { in: [applicantA, applicantB] } } });
    await database.$disconnect();
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
    const restarted = new PrismaClient({ datasourceUrl: testUrl });
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
});
