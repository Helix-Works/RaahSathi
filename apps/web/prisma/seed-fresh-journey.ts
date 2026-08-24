import { createHmac } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const database = new PrismaClient();

const freshApplicant = {
  id: "10000000-0000-4000-8000-000000000003",
  mobile: "9000000003",
  mobileLast4: "0003",
  displayName: "Fresh Journey Demo",
} as const;

const freshApplication = {
  id: "30000000-0000-4000-8000-000000000002",
  eventId: "32000000-0000-4000-8000-000000000003",
} as const;

function lookupHash(mobileNumber: string, pepper: string): string {
  return createHmac("sha256", pepper).update(`+91${mobileNumber}`, "utf8").digest("hex");
}

async function main() {
  const pepper = process.env.AUTH_MOBILE_LOOKUP_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error("AUTH_MOBILE_LOOKUP_PEPPER must contain at least 32 characters.");
  }

  const mobileLookupHash = lookupHash(freshApplicant.mobile, pepper);
  const created = await database.$transaction(async (transaction) => {
    const existingApplicant = await transaction.applicant.findFirst({
      where: {
        OR: [
          { id: freshApplicant.id },
          { mobileLookupHash },
        ],
      },
      select: {
        id: true,
        mobileLookupHash: true,
        mobileLast4: true,
        authScenario: true,
      },
    });

    if (existingApplicant) {
      const isExpectedApplicant = existingApplicant.id === freshApplicant.id
        && existingApplicant.mobileLookupHash === mobileLookupHash
        && existingApplicant.mobileLast4 === freshApplicant.mobileLast4
        && existingApplicant.authScenario === "STANDARD";
      if (!isExpectedApplicant) {
        throw new Error("The fresh-journey applicant key conflicts with an existing synthetic record.");
      }
    } else {
      await transaction.applicant.create({
        data: {
          id: freshApplicant.id,
          mobileLookupHash,
          mobileLast4: freshApplicant.mobileLast4,
          displayName: freshApplicant.displayName,
          authScenario: "STANDARD",
        },
      });
    }

    const existingApplication = await transaction.application.findFirst({
      where: {
        OR: [
          { id: freshApplication.id },
          { applicantId: freshApplicant.id, serviceKey: "LEARNER_LICENCE" },
        ],
      },
      select: {
        id: true,
        applicantId: true,
        serviceKey: true,
        identityScenario: true,
        paymentScenario: true,
      },
    });

    if (existingApplication) {
      const isExpectedApplication = existingApplication.id === freshApplication.id
        && existingApplication.applicantId === freshApplicant.id
        && existingApplication.serviceKey === "LEARNER_LICENCE"
        && existingApplication.identityScenario === "SUCCESS"
        && existingApplication.paymentScenario === "SUCCESS";
      if (!isExpectedApplication) {
        throw new Error("The fresh-journey application key conflicts with an existing synthetic record.");
      }
      return false;
    }

    await transaction.application.create({
      data: {
        id: freshApplication.id,
        applicantId: freshApplicant.id,
        serviceKey: "LEARNER_LICENCE",
        status: "DRAFT",
        identityScenario: "SUCCESS",
        paymentScenario: "SUCCESS",
        events: {
          create: {
            id: freshApplication.eventId,
            actorApplicantId: freshApplicant.id,
            eventType: "APPLICATION_CREATED",
            correlationId: "synthetic-fresh-journey-seed",
          },
        },
      },
    });
    return true;
  });

  console.info(created
    ? "Seeded one fresh synthetic learner-licence journey."
    : "Fresh synthetic learner-licence journey already exists; left it unchanged.");
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.name : "FreshJourneySeedError");
    process.exitCode = 1;
  })
  .finally(async () => database.$disconnect());
