import { PrismaClient } from "@prisma/client";

import { assertPhase7HeroCommandEnvironment } from "./phase7-hero-command-safety";
import { phase7HeroSeedNow, releasePhase7HeroSlot } from "./phase7-hero-seed";

const database = new PrismaClient();

async function main(): Promise<void> {
  assertPhase7HeroCommandEnvironment();
  const result = await releasePhase7HeroSlot(
    database,
    process.env.RAAHSATHI_DEMO_RESET_CONFIRMATION,
    phase7HeroSeedNow(process.env.RAAHSATHI_DEMO_SEED_DATE),
  );
  console.info(result === "released"
    ? "Released the Phase 7 synthetic slot. Process the authenticated hero waitlist to allocate its offer."
    : "The Phase 7 synthetic slot was already released; no state changed.");
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Phase7HeroReleaseError");
    process.exitCode = 1;
  })
  .finally(async () => database.$disconnect());
