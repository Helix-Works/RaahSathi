import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  phase6DemoApplicants,
  phase6DemoApplications,
  phase6DemoDirectSlot,
  phase6DemoFullSlot,
  phase6DemoPaymentFixture,
  phase6DemoRto,
  seedPhase6Demo,
} from "../../../prisma/phase6-demo-seed";
import { isDisposableDatabaseApproved } from "@/server/auth/database-test-safety";
import { createDatabaseTestClient } from "@/server/database/database-test-client";

import { getPaymentContextForApplication } from "./payment-service";

const testUrl = process.env.TEST_DATABASE_URL;
const approved = isDisposableDatabaseApproved({
  testDatabaseUrl: testUrl,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if ((testUrl || process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION) && !approved) {
  throw new Error("Refusing Phase 6 seed tests: database identities are not safely distinct.");
}
const database = approved ? createDatabaseTestClient(testUrl) : undefined;
const pepper = "phase-6-demo-test-mobile-pepper-at-least-32-characters";

async function removeFixture(): Promise<void> {
  if (!database) return;
  await database.appointment.deleteMany({
    where: { applicationId: { in: phase6DemoApplications.map(({ id }) => id) } },
  });
  await database.application.deleteMany({ where: { id: { in: phase6DemoApplications.map(({ id }) => id) } } });
  await database.appointmentSlot.deleteMany({ where: { id: { in: [phase6DemoFullSlot.id, phase6DemoDirectSlot.id] } } });
  await database.rto.deleteMany({ where: { id: phase6DemoRto.id } });
  await database.applicant.deleteMany({ where: { id: { in: phase6DemoApplicants.map(({ id }) => id) } } });
}

describe.skipIf(!database)("Phase 6 deterministic payment seed", () => {
  beforeAll(removeFixture);
  afterAll(async () => {
    if (!database) return;
    try {
      await removeFixture();
    } finally {
      await database.$disconnect();
    }
  });

  it("creates reconstructable contexts and narrowly reconciles only the legacy seed references", async () => {
    if (!database) return;
    const fixtureNow = new Date("2026-08-26T10:00:00.000Z");
    expect(await seedPhase6Demo(database, pepper, fixtureNow)).toBe("created");

    for (const index of [0, 1] as const) {
      const fixture = phase6DemoPaymentFixture(index);
      const context = await getPaymentContextForApplication({
        sessionId: randomUUID(),
        applicantId: fixture.application.applicantId,
      }, fixture.application.id, database);
      expect(context.attempt).toMatchObject({
        id: fixture.paymentAttemptId,
        providerReference: fixture.providerReference,
        status: "SUCCEEDED",
      });
    }

    for (let index = 0; index < phase6DemoApplications.length; index += 1) {
      const fixture = phase6DemoPaymentFixture(index);
      await database.paymentAttempt.update({
        where: { id: fixture.paymentAttemptId },
        data: { providerReference: fixture.legacyProviderReference },
      });
    }
    expect(await seedPhase6Demo(database, pepper, fixtureNow)).toBe("reconciled");
    expect(await seedPhase6Demo(database, pepper, fixtureNow)).toBe("unchanged");
    expect(await seedPhase6Demo(database, pepper, new Date("2026-08-27T10:00:00.000Z"))).toBe("requires-fresh-fixtures");
    expect((await database.appointmentSlot.findUniqueOrThrow({
      where: { id: phase6DemoFullSlot.id },
    })).date.toISOString().slice(0, 10)).toBe("2026-08-27");

    const direct = phase6DemoPaymentFixture(1);
    const directContext = await getPaymentContextForApplication({
      sessionId: randomUUID(),
      applicantId: direct.application.applicantId,
    }, direct.application.id, database);
    expect(directContext.attempt?.providerReference).toBe(direct.providerReference);

    const unexpectedReference = "SYN-PAY-UNEXPECTED-FIXTURE";
    await database.paymentAttempt.update({
      where: { id: direct.paymentAttemptId },
      data: { providerReference: unexpectedReference },
    });
    await expect(seedPhase6Demo(database, pepper)).rejects.toThrow(
      "Phase 6 demo identifiers conflict with incompatible synthetic records.",
    );
    expect((await database.paymentAttempt.findUniqueOrThrow({
      where: { id: direct.paymentAttemptId },
    })).providerReference).toBe(unexpectedReference);
  });
});
