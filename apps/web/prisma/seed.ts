import { createHmac } from "node:crypto";

import { PrismaClient } from "@prisma/client";

import { seedSyntheticApplication } from "./seed-application";
import { seedSyntheticAppointments } from "./seed-appointments";

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
    { id: "10000000-0000-4000-8000-000000000009", mobile: "9000000009", displayName: "Four Services Demo", authScenario: "STANDARD" as const },
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
  await seedSyntheticApplication(database, applicants[0].id);
  await seedSyntheticAppointments(database);
  await database.licenceRecord.upsert({
    where: { applicantId_kind: { applicantId: applicants[0].id, kind: "LEARNER" } },
    create: {
      id: "33000000-0000-4000-8000-000000000001",
      applicantId: applicants[0].id,
      kind: "LEARNER",
      syntheticReference: "SYN-LL-DEMO-0001",
      vehicleClass: "LMV",
      issuedAt: new Date("2026-01-15T00:00:00.000Z"),
      validUntil: new Date("2026-12-31T23:59:59.000Z"),
    },
    update: {},
  });
  await database.licenceRecord.upsert({
    where: { applicantId_kind: { applicantId: applicants[2].id, kind: "PERMANENT" } },
    create: {
      id: "33000000-0000-4000-8000-000000000009",
      applicantId: applicants[2].id,
      kind: "PERMANENT",
      syntheticReference: "SYN-DL-PHASE8-0009",
      vehicleClass: "LMV",
      issuedAt: new Date("2024-01-15T00:00:00.000Z"),
      validUntil: new Date("2029-01-14T23:59:59.000Z"),
      addressDistrict: "NORTH_WEST",
      addressPostalCode: "110085",
    },
    update: {},
  });
  console.info("Seeded synthetic applicants, licence contexts, a resumable learner application, Delhi RTOs, and appointment states.");
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.name : "SeedError");
    process.exitCode = 1;
  })
  .finally(async () => database.$disconnect());
