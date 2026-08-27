import { PrismaClient } from "@prisma/client";

import { advancePhase7Hero } from "./phase7-hero-seed";

const database = new PrismaClient();

async function main(): Promise<void> {
  const result = await advancePhase7Hero(database, process.env.RAAHSATHI_DEMO_RESET_CONFIRMATION);
  console.info(result === "created"
    ? "Advanced the Phase 7 hero to the Permanent DL appointment milestone; the active session was preserved."
    : "The Phase 7 hero is already at the Permanent DL milestone; no state changed.");
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Phase7HeroAdvanceError");
    process.exitCode = 1;
  })
  .finally(async () => database.$disconnect());
