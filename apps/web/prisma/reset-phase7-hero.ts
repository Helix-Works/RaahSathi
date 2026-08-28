import { PrismaClient } from "@prisma/client";

import { assertPhase7HeroCommandEnvironment } from "./phase7-hero-command-safety";
import { phase7HeroSeedNow, resetPhase7Hero } from "./phase7-hero-seed";

const database = new PrismaClient();

async function main(): Promise<void> {
  assertPhase7HeroCommandEnvironment();
  const pepper = process.env.AUTH_MOBILE_LOOKUP_PEPPER;
  if (!pepper) throw new Error("AUTH_MOBILE_LOOKUP_PEPPER must contain at least 32 characters.");
  await resetPhase7Hero(
    database,
    pepper,
    process.env.RAAHSATHI_DEMO_RESET_CONFIRMATION,
    phase7HeroSeedNow(process.env.RAAHSATHI_DEMO_SEED_DATE),
  );
  console.info("Reset the enumerated Phase 7 records. Hero mobile: 9000000007. Fresh mobile: 9000000009.");
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Phase7HeroResetError");
    process.exitCode = 1;
  })
  .finally(async () => database.$disconnect());
