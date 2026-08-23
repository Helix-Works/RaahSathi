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
  const seedApplicationId = "30000000-0000-4000-8000-000000000001";
  await database.application.upsert({
    where: { applicantId_serviceKey: { applicantId: applicants[0].id, serviceKey: "LEARNER_LICENCE" } },
    create: {
      id: seedApplicationId,
      applicantId: applicants[0].id,
      serviceKey: "LEARNER_LICENCE",
      status: "IN_PROGRESS",
      sections: {
        create: {
          id: "31000000-0000-4000-8000-000000000001",
          sectionKey: "PERSONAL_DETAILS",
          data: { fullName: "RaahSathi Demo", dateOfBirth: "1995-01-15" },
          completedAt: new Date("2026-08-23T00:00:00.000Z"),
        },
      },
      events: {
        create: [
          {
            id: "32000000-0000-4000-8000-000000000001",
            actorApplicantId: applicants[0].id,
            eventType: "APPLICATION_CREATED",
            correlationId: "synthetic-seed",
            createdAt: new Date("2026-08-23T00:00:00.000Z"),
          },
          {
            id: "32000000-0000-4000-8000-000000000002",
            actorApplicantId: applicants[0].id,
            eventType: "SECTION_COMPLETED",
            sectionKey: "PERSONAL_DETAILS",
            correlationId: "synthetic-seed",
            createdAt: new Date("2026-08-23T00:00:01.000Z"),
          },
        ],
      },
    },
    // Seeding initializes missing demo state; reruns must not rewind durable workflow progress.
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
