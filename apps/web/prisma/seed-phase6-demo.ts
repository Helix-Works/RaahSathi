import { PrismaClient } from "@prisma/client";

import { seedPhase6Demo } from "./phase6-demo-seed";

const database = new PrismaClient();

async function main(): Promise<void> {
  const pepper = process.env.AUTH_MOBILE_LOOKUP_PEPPER;
  if (!pepper) throw new Error("AUTH_MOBILE_LOOKUP_PEPPER must contain at least 32 characters.");
  const result = await seedPhase6Demo(database, pepper);
  console.info(result === "created"
    ? "Seeded Phase 6 synthetic waitlist/direct-booking fixtures."
    : result === "reconciled"
      ? "Reconciled the validated Phase 6 demo payment references; durable journey progress was preserved."
      : result === "requires-fresh-fixtures"
        ? "Phase 6 fixture slots use an older date. Seed a fresh disposable database rather than rewriting durable demo progress."
      : "Phase 6 synthetic fixtures already exist; left durable journey state unchanged.");
  console.info("Synthetic mobiles: waitlist 9000000004, direct booking 9000000005.");
}

void main()
  .catch((error: unknown) => {
    if (error instanceof Error) {
      const secretValues = [process.env.DATABASE_URL, process.env.DIRECT_URL, process.env.TEST_DATABASE_URL]
        .filter((value): value is string => Boolean(value));
      console.error(secretValues.reduce((message, secret) => message.replaceAll(secret, "[redacted]"), error.message));
    } else {
      console.error("Phase6DemoSeedError");
    }
    process.exitCode = 1;
  })
  .finally(async () => database.$disconnect());
