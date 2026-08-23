import { createHmac } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const database = new PrismaClient();

function lookupHash(mobileNumber: string, pepper: string): string {
  return createHmac("sha256", pepper).update(`+91${mobileNumber}`, "utf8").digest("hex");
}

async function main() {
  const pepper = process.env.AUTH_MOBILE_LOOKUP_PEPPER;
  if (!pepper || pepper.length < 32) throw new Error("AUTH_MOBILE_LOOKUP_PEPPER must contain at least 32 characters.");

  const applicants = [
    { id: "10000000-0000-4000-8000-000000000001", mobile: "9000000000", displayName: "RaahSathi Demo", authScenario: "STANDARD" as const },
    { id: "10000000-0000-4000-8000-000000000002", mobile: "9000000002", displayName: "Provider Failure Demo", authScenario: "PROVIDER_UNAVAILABLE" as const },
  ];
  for (const applicant of applicants) {
    const mobileLookupHash = lookupHash(applicant.mobile, pepper);
    await database.applicant.upsert({
      where: { id: applicant.id },
      create: {
        id: applicant.id,
        mobileLookupHash,
        mobileLast4: applicant.mobile.slice(-4),
        displayName: applicant.displayName,
        authScenario: applicant.authScenario,
      },
      update: {
        mobileLookupHash,
        mobileLast4: applicant.mobile.slice(-4),
        displayName: applicant.displayName,
        authScenario: applicant.authScenario,
      },
    });
  }
  const applicationId = "30000000-0000-4000-8000-000000000001";
  await database.application.upsert({
    where: { id: applicationId },
    create: { id: applicationId, applicantId: applicants[0].id, serviceKey: "LEARNER_LICENCE", status: "IN_PROGRESS" },
    update: { applicantId: applicants[0].id, serviceKey: "LEARNER_LICENCE", status: "IN_PROGRESS" },
  });
  await database.applicationSection.upsert({
    where: { applicationId_sectionKey: { applicationId, sectionKey: "PERSONAL_DETAILS" } },
    create: {
      id: "31000000-0000-4000-8000-000000000001", applicationId, sectionKey: "PERSONAL_DETAILS",
      data: { fullName: "RaahSathi Demo", dateOfBirth: "1995-01-15" }, completedAt: new Date("2026-08-23T00:00:00.000Z"),
    },
    update: { data: { fullName: "RaahSathi Demo", dateOfBirth: "1995-01-15" }, completedAt: new Date("2026-08-23T00:00:00.000Z") },
  });
  await database.applicationEvent.upsert({
    where: { id: "32000000-0000-4000-8000-000000000001" },
    create: {
      id: "32000000-0000-4000-8000-000000000001", applicationId, actorApplicantId: applicants[0].id,
      eventType: "APPLICATION_CREATED", correlationId: "synthetic-seed", createdAt: new Date("2026-08-23T00:00:00.000Z"),
    },
    update: {},
  });
  await database.applicationEvent.upsert({
    where: { id: "32000000-0000-4000-8000-000000000002" },
    create: {
      id: "32000000-0000-4000-8000-000000000002", applicationId, actorApplicantId: applicants[0].id,
      eventType: "SECTION_COMPLETED", sectionKey: "PERSONAL_DETAILS", correlationId: "synthetic-seed",
      createdAt: new Date("2026-08-23T00:00:01.000Z"),
    },
    update: {},
  });
  console.info("Seeded synthetic applicants and one resumable learner application.");
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.name : "SeedError");
    process.exitCode = 1;
  })
  .finally(async () => database.$disconnect());
