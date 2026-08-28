import type { PrismaClient } from "@prisma/client";

export const syntheticApplicationId = "30000000-0000-4000-8000-000000000001";

export async function seedSyntheticApplication(database: PrismaClient, applicantId: string) {
  const existing = await database.application.findFirst({
    where: { applicantId, serviceKey: "LEARNER_LICENCE" },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) {
    return database.application.update({
      where: { id: existing.id },
      data: { identityScenario: "PROVIDER_UNAVAILABLE", paymentScenario: "DUPLICATE_CALLBACK" },
    });
  }
  return database.application.create({
    data: {
      id: syntheticApplicationId,
      applicantId,
      serviceKey: "LEARNER_LICENCE",
      status: "IN_PROGRESS",
      identityScenario: "PROVIDER_UNAVAILABLE",
      paymentScenario: "DUPLICATE_CALLBACK",
      sections: {
        create: {
          id: "31000000-0000-4000-8000-000000000001",
          sectionKey: "PERSONAL_DETAILS",
          data: { fullName: "Aditi Sharma", dateOfBirth: "1995-01-15" },
          completedAt: new Date("2026-08-23T00:00:00.000Z"),
        },
      },
      events: {
        create: [
          {
            id: "32000000-0000-4000-8000-000000000001",
            actorApplicantId: applicantId,
            eventType: "APPLICATION_CREATED",
            correlationId: "synthetic-seed",
            createdAt: new Date("2026-08-23T00:00:00.000Z"),
          },
          {
            id: "32000000-0000-4000-8000-000000000002",
            actorApplicantId: applicantId,
            eventType: "SECTION_COMPLETED",
            sectionKey: "PERSONAL_DETAILS",
            correlationId: "synthetic-seed",
            createdAt: new Date("2026-08-23T00:00:01.000Z"),
          },
        ],
      },
    },
  });
}
