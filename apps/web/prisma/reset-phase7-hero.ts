import { PrismaClient } from "@prisma/client";

import { resetPhase7Hero } from "./phase7-hero-seed";

const database = new PrismaClient();

async function main(): Promise<void> {
  const pepper = process.env.AUTH_MOBILE_LOOKUP_PEPPER;
  if (!pepper) throw new Error("AUTH_MOBILE_LOOKUP_PEPPER must contain at least 32 characters.");
  await resetPhase7Hero(database, pepper, process.env.RAAHSATHI_DEMO_RESET_CONFIRMATION);
  console.info("Reset only the enumerated Phase 7 synthetic records. Hero mobile: 9000000007.");
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Phase7HeroResetError");
    process.exitCode = 1;
  })
  .finally(async () => database.$disconnect());
