import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { isDisposableDatabaseApproved } from "@/server/auth/database-test-safety";

import {
  getPayment,
  processSignedPaymentProviderEvent,
  signPaymentProviderEvent,
  startPayment,
} from "./payment-service";

const testUrl = process.env.TEST_DATABASE_URL;
const approved = isDisposableDatabaseApproved({
  testDatabaseUrl: testUrl,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if ((testUrl || process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION) && !approved) {
  throw new Error("Refusing Phase 4 database tests: database identities are not safely distinct.");
}
const database = approved ? new PrismaClient({ datasourceUrl: testUrl }) : undefined;

describe.skipIf(!database)("Phase 4 disposable PostgreSQL payment convergence", () => {
  const applicantA = randomUUID();
  const applicantB = randomUUID();
  const applicationId = randomUUID();
  const identityAttemptId = randomUUID();
  const contextA = { sessionId: randomUUID(), applicantId: applicantA };
  const contextB = { sessionId: randomUUID(), applicantId: applicantB };
  const secret = "phase-4-database-provider-secret-at-least-32-characters";

  afterAll(async () => {
    if (!database) return;
    await database.application.deleteMany({ where: { id: applicationId } });
    await database.applicant.deleteMany({ where: { id: { in: [applicantA, applicantB] } } });
    await database.$disconnect();
  });

  it("converges delayed and duplicate success once without a browser while enforcing amount and ownership", async () => {
    if (!database) return;
    await database.applicant.createMany({ data: [
      { id: applicantA, mobileLookupHash: `phase4-${applicantA}`, mobileLast4: "0000", displayName: "Phase 4 A" },
      { id: applicantB, mobileLookupHash: `phase4-${applicantB}`, mobileLast4: "0001", displayName: "Phase 4 B" },
    ] });
    await database.application.create({ data: {
      id: applicationId,
      applicantId: applicantA,
      serviceKey: "LEARNER_LICENCE",
      status: "READY_FOR_PAYMENT",
      paymentScenario: "DELAYED_SUCCESS",
      identityAttempts: { create: {
        id: identityAttemptId,
        outcome: "VERIFIED",
        attemptNumber: 1,
        correlationId: "phase4-identity",
      } },
    } });

    const pending = await startPayment(contextA, {
      applicationId,
      idempotencyKey: randomUUID(),
      correlationId: "phase4-start",
    }, database);
    expect(pending.attempt?.status).toBe("PENDING");
    expect(pending.fee.totalAmountMinor).toBe(55_000);

    const event = {
      eventId: `evt_${randomUUID().replaceAll("-", "")}`,
      providerReference: pending.attempt?.providerReference ?? "",
      outcome: "SUCCESS" as const,
      amountMinor: pending.fee.totalAmountMinor,
      occurredAt: "2026-08-23T12:00:00.000Z",
    };
    const signature = signPaymentProviderEvent(event, secret);
    const [first, duplicate] = await Promise.all([
      processSignedPaymentProviderEvent(event, signature, "phase4-provider-a", { secret, database }),
      processSignedPaymentProviderEvent(event, signature, "phase4-provider-b", { secret, database }),
    ]);
    expect(first.attempt?.status).toBe("SUCCEEDED");
    expect(duplicate.attempt?.id).toBe(first.attempt?.id);
    expect(await database.paymentProviderEvent.count({ where: { paymentAttemptId: first.attempt?.id } })).toBe(1);
    expect(await database.applicationEvent.count({ where: { applicationId, eventType: "PAYMENT_SUCCEEDED" } })).toBe(1);
    expect((await database.application.findUniqueOrThrow({ where: { id: applicationId } })).status).toBe("READY_FOR_APPOINTMENT");

    const conflictingReplay = { ...event, outcome: "FAILED" as const };
    await expect(processSignedPaymentProviderEvent(
      conflictingReplay,
      signPaymentProviderEvent(conflictingReplay, secret),
      "phase4-conflicting-replay",
      { secret, database },
    )).rejects.toThrowError(/PAYMENT_EVENT_INVALID/);

    const tampered = { ...event, eventId: `evt_${randomUUID().replaceAll("-", "")}`, amountMinor: 1 };
    await expect(processSignedPaymentProviderEvent(
      tampered,
      signPaymentProviderEvent(tampered, secret),
      "phase4-tamper",
      { secret, database },
    )).rejects.toThrowError(/PAYMENT_EVENT_INVALID/);
    expect((await getPayment(contextA, first.attempt?.id ?? "", database)).attempt?.status).toBe("SUCCEEDED");
    await expect(getPayment(contextB, first.attempt?.id ?? "", database)).rejects.toThrowError(/RESOURCE_NOT_FOUND/);
  });
});
