import { PrismaClient } from "@prisma/client";

import { releasePhase7HeroSlot } from "./phase7-hero-seed";

const database = new PrismaClient();

async function main(): Promise<void> {
  const result = await releasePhase7HeroSlot(database, process.env.RAAHSATHI_DEMO_RESET_CONFIRMATION);
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
