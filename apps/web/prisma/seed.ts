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
  console.info("Seeded STANDARD and PROVIDER_UNAVAILABLE synthetic applicants.");
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.name : "SeedError");
    process.exitCode = 1;
  })
  .finally(async () => database.$disconnect());
