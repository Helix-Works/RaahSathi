import { createHmac } from "node:crypto";

import { Prisma, type PrismaClient } from "@prisma/client";

export const phase6DemoSeedLockKey = "raahsathi:seed:phase6-demo";

export const phase6DemoApplicants = [
  { id: "10000000-0000-4000-8000-000000000004", mobile: "9000000004", name: "Waitlist Journey Demo" },
  { id: "10000000-0000-4000-8000-000000000005", mobile: "9000000005", name: "Direct Booking Demo" },
  { id: "10000000-0000-4000-8000-000000000006", mobile: "9000000006", name: "Capacity Holder Demo" },
] as const;

export const phase6DemoApplications = [
  { id: "30000000-0000-4000-8000-000000000003", applicantId: phase6DemoApplicants[0].id, label: "waitlist" },
  { id: "30000000-0000-4000-8000-000000000004", applicantId: phase6DemoApplicants[1].id, label: "direct" },
  { id: "30000000-0000-4000-8000-000000000005", applicantId: phase6DemoApplicants[2].id, label: "holder" },
] as const;

export const phase6DemoRto = {
  id: "50000000-0000-4000-8000-000000000004",
  code: "SYNTHETIC_WAITLIST_DEMO",
  nameEn: "Rohini Demo RTO",
  nameHi: "रोहिणी डेमो आरटीओ",
  district: "Delhi",
} as const;

export const phase6DemoFullSlot = {
  id: "51000000-0000-4000-8000-000000000004",
  startTime: "09:00",
  endTime: "09:30",
} as const;
export const phase6DemoDirectSlot = {
  id: "51000000-0000-4000-8000-000000000005",
  startTime: "10:00",
  endTime: "10:30",
} as const;
export const phase6DemoHolderAppointmentId = "52000000-0000-4000-8000-000000000001";

export function phase6DemoFixtureId(prefix: string, ordinal: number): string {
  return `${prefix}-0000-4000-8000-${String(ordinal).padStart(12, "0")}`;
}

export function phase6DemoPaymentFixture(applicationIndex: number) {
  const application = phase6DemoApplications[applicationIndex];
  if (!application) throw new Error("Unknown Phase 6 demo application index.");
  const paymentAttemptId = phase6DemoFixtureId("42000000", applicationIndex + 41);
  return {
    application,
    feeSnapshotId: phase6DemoFixtureId("41000000", applicationIndex + 41),
    paymentAttemptId,
    idempotencyKey: phase6DemoFixtureId("43000000", applicationIndex + 41),
    providerReference: `SYN-PAY-${paymentAttemptId.toUpperCase()}`,
    legacyProviderReference: `SYN-PHASE6-${application.label.toUpperCase()}`,
    paymentSucceededEventId: phase6DemoFixtureId("32000000", applicationIndex * 10 + 43),
    correlationId: `synthetic-phase6-${application.label}`,
  } as const;
}

function lookupHash(mobileNumber: string, pepper: string): string {
  return createHmac("sha256", pepper).update(`+91${mobileNumber}`, "utf8").digest("hex");
}

function sectionRecords(applicationIndex: number) {
  return [
    { id: phase6DemoFixtureId("31000000", applicationIndex * 10 + 41), sectionKey: "PERSONAL_DETAILS" as const,
      data: { fullName: phase6DemoApplicants[applicationIndex]?.name, dateOfBirth: "1995-01-15" } },
    { id: phase6DemoFixtureId("31000000", applicationIndex * 10 + 42), sectionKey: "ADDRESS" as const,
      data: { district: "NORTH_WEST", postalCode: "110001" } },
    { id: phase6DemoFixtureId("31000000", applicationIndex * 10 + 43), sectionKey: "SERVICE_DETAILS" as const,
      data: { vehicleClass: "LMV" } },
    { id: phase6DemoFixtureId("31000000", applicationIndex * 10 + 44), sectionKey: "DECLARATION" as const,
      data: { accepted: true } },
  ];
}

async function createReadyApplication(
  transaction: Prisma.TransactionClient,
  applicationIndex: number,
  journeyAt: Date,
): Promise<void> {
  const paymentFixture = phase6DemoPaymentFixture(applicationIndex);
  const fixture = paymentFixture.application;
  await transaction.application.create({
    data: {
      id: fixture.id,
      applicantId: fixture.applicantId,
      serviceKey: "LEARNER_LICENCE",
      status: applicationIndex === 2 ? "APPOINTMENT_BOOKED" : "READY_FOR_APPOINTMENT",
      identityScenario: "SUCCESS",
      paymentScenario: "SUCCESS",
      sections: { create: sectionRecords(applicationIndex).map((section) => ({ ...section, completedAt: journeyAt })) },
      events: { create: [
        { id: phase6DemoFixtureId("32000000", applicationIndex * 10 + 41), actorApplicantId: fixture.applicantId,
          eventType: "APPLICATION_CREATED", correlationId: paymentFixture.correlationId },
        { id: phase6DemoFixtureId("32000000", applicationIndex * 10 + 42), actorApplicantId: fixture.applicantId,
          eventType: "IDENTITY_VERIFIED", correlationId: paymentFixture.correlationId },
        { id: paymentFixture.paymentSucceededEventId, actorApplicantId: fixture.applicantId,
          eventType: "PAYMENT_SUCCEEDED", correlationId: paymentFixture.correlationId },
      ] },
      identityAttempts: { create: {
        id: phase6DemoFixtureId("34000000", applicationIndex + 41),
        outcome: "VERIFIED",
        attemptNumber: 1,
        correlationId: paymentFixture.correlationId,
      } },
    },
  });
  await transaction.feeSnapshot.create({ data: {
    id: paymentFixture.feeSnapshotId,
    applicationId: fixture.id,
    baseFeeMinor: 50_000,
    serviceChargeMinor: 5_000,
    totalAmountMinor: 55_000,
    currency: "INR",
  } });
  await transaction.paymentAttempt.create({ data: {
    id: paymentFixture.paymentAttemptId,
    applicationId: fixture.id,
    feeSnapshotId: paymentFixture.feeSnapshotId,
    attemptNumber: 1,
    idempotencyKey: paymentFixture.idempotencyKey,
    providerReference: paymentFixture.providerReference,
    status: "SUCCEEDED",
    amountMinor: 55_000,
    succeededAt: journeyAt,
  } });
}

export type Phase6DemoSeedResult = "created" | "reconciled" | "unchanged" | "requires-fresh-fixtures";

export async function seedPhase6Demo(
  database: PrismaClient,
  pepper: string,
  now = new Date(),
): Promise<Phase6DemoSeedResult> {
  if (pepper.length < 32) throw new Error("AUTH_MOBILE_LOOKUP_PEPPER must contain at least 32 characters.");
  const seedDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const slotDate = new Date(`${seedDate}T00:00:00.000Z`);
  const releasedAt = new Date(slotDate.getTime() - 24 * 60 * 60 * 1000);
  const expectedApplicants = phase6DemoApplicants.map((applicant) => ({
    ...applicant,
    mobileLookupHash: lookupHash(applicant.mobile, pepper),
  }));

  return database.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${phase6DemoSeedLockKey}))::text`;
    const [foundApplicants, foundApplications, foundRtos, foundSlots] = await Promise.all([
      transaction.applicant.findMany({ where: { OR: [
        { id: { in: expectedApplicants.map(({ id }) => id) } },
        { mobileLookupHash: { in: expectedApplicants.map(({ mobileLookupHash }) => mobileLookupHash) } },
      ] } }),
      transaction.application.findMany({
        where: { OR: [
          { id: { in: phase6DemoApplications.map(({ id }) => id) } },
          { applicantId: { in: phase6DemoApplications.map(({ applicantId }) => applicantId) }, serviceKey: "LEARNER_LICENCE" },
        ] },
        include: {
          feeSnapshot: true,
          paymentAttempts: { include: { providerEvents: { select: { id: true } } } },
          events: { where: { eventType: "PAYMENT_SUCCEEDED" } },
        },
      }),
      transaction.rto.findMany({ where: { OR: [{ id: phase6DemoRto.id }, { code: phase6DemoRto.code }] } }),
      transaction.appointmentSlot.findMany({ where: { id: { in: [phase6DemoFullSlot.id, phase6DemoDirectSlot.id] } } }),
    ]);
    const existingCount = foundApplicants.length + foundApplications.length + foundRtos.length + foundSlots.length;
    if (existingCount > 0) {
      const applicantsMatch = foundApplicants.length === phase6DemoApplicants.length
        && expectedApplicants.every((expected) => foundApplicants.some((found) =>
          found.id === expected.id && found.mobileLookupHash === expected.mobileLookupHash
          && found.mobileLast4 === expected.mobile.slice(-4) && found.authScenario === "STANDARD"));
      const applicationsMatch = foundApplications.length === phase6DemoApplications.length
        && phase6DemoApplications.every((expected, applicationIndex) => {
          const found = foundApplications.find((candidate) => candidate.id === expected.id);
          const payment = phase6DemoPaymentFixture(applicationIndex);
          const attempt = found?.paymentAttempts[0];
          const providerReferenceMatches = attempt?.providerReference === payment.providerReference
            || attempt?.providerReference === payment.legacyProviderReference;
          return found?.applicantId === expected.applicantId
            && found.serviceKey === "LEARNER_LICENCE"
            && found.identityScenario === "SUCCESS"
            && found.paymentScenario === "SUCCESS"
            && found.feeSnapshot?.id === payment.feeSnapshotId
            && found.feeSnapshot.baseFeeMinor === 50_000
            && found.feeSnapshot.serviceChargeMinor === 5_000
            && found.feeSnapshot.totalAmountMinor === 55_000
            && found.feeSnapshot.currency === "INR"
            && found.paymentAttempts.length === 1
            && attempt?.id === payment.paymentAttemptId
            && attempt.feeSnapshotId === payment.feeSnapshotId
            && attempt.attemptNumber === 1
            && attempt.idempotencyKey === payment.idempotencyKey
            && providerReferenceMatches
            && attempt.status === "SUCCEEDED"
            && attempt.amountMinor === 55_000
            && attempt.succeededAt !== null
            && attempt.providerEvents.length === 0
            && found.events.some((event) => event.id === payment.paymentSucceededEventId
              && event.actorApplicantId === expected.applicantId
              && event.correlationId === payment.correlationId);
        });
      const rtoMatches = foundRtos.length === 1 && foundRtos.some((found) =>
        found.id === phase6DemoRto.id && found.code === phase6DemoRto.code);
      const slotsMatch = [phase6DemoFullSlot, phase6DemoDirectSlot].every((expected) => foundSlots.some((found) =>
        found.id === expected.id && found.rtoId === phase6DemoRto.id && found.serviceKey === "LEARNER_LICENCE"
        && found.startTime === expected.startTime && found.endTime === expected.endTime));
      if (!applicantsMatch || !applicationsMatch || !rtoMatches || !slotsMatch) {
        throw new Error("Phase 6 demo identifiers conflict with incompatible synthetic records.");
      }
      if (foundSlots.some((slot) => slot.date.toISOString().slice(0, 10) !== seedDate)) {
        // A booked fixture may already refer to this slot. Do not rewrite durable demo progress;
        // callers can seed a fresh disposable database for a new appointment date instead.
        return "requires-fresh-fixtures";
      }

      let repaired = 0;
      const existingRto = foundRtos.find((found) => found.id === phase6DemoRto.id);
      if (existingRto && (existingRto.nameEn !== phase6DemoRto.nameEn || existingRto.nameHi !== phase6DemoRto.nameHi || existingRto.district !== phase6DemoRto.district)) {
        await transaction.rto.update({
          where: { id: phase6DemoRto.id },
          data: { nameEn: phase6DemoRto.nameEn, nameHi: phase6DemoRto.nameHi, district: phase6DemoRto.district },
        });
        repaired += 1;
      }
      for (let applicationIndex = 0; applicationIndex < phase6DemoApplications.length; applicationIndex += 1) {
        const payment = phase6DemoPaymentFixture(applicationIndex);
        const found = foundApplications.find((candidate) => candidate.id === payment.application.id);
        if (found?.paymentAttempts[0]?.providerReference !== payment.legacyProviderReference) continue;
        const update = await transaction.paymentAttempt.updateMany({
          where: {
            id: payment.paymentAttemptId,
            applicationId: payment.application.id,
            feeSnapshotId: payment.feeSnapshotId,
            idempotencyKey: payment.idempotencyKey,
            providerReference: payment.legacyProviderReference,
            attemptNumber: 1,
            status: "SUCCEEDED",
            amountMinor: 55_000,
          },
          data: { providerReference: payment.providerReference },
        });
        if (update.count !== 1) {
          throw new Error("Phase 6 demo payment reconciliation lost ownership of an expected record.");
        }
        repaired += 1;
      }
      return repaired > 0 ? "reconciled" : "unchanged";
    }

    await transaction.applicant.createMany({ data: expectedApplicants.map((applicant) => ({
      id: applicant.id,
      mobileLookupHash: applicant.mobileLookupHash,
      mobileLast4: applicant.mobile.slice(-4),
      displayName: applicant.name,
      authScenario: "STANDARD",
    })) });
    await transaction.rto.create({ data: phase6DemoRto });
    await transaction.appointmentSlot.createMany({ data: [
      { ...phase6DemoFullSlot, rtoId: phase6DemoRto.id, serviceKey: "LEARNER_LICENCE", date: slotDate, capacity: 1, bookedCount: 1, releasedAt },
      { ...phase6DemoDirectSlot, rtoId: phase6DemoRto.id, serviceKey: "LEARNER_LICENCE", date: slotDate, capacity: 1, bookedCount: 0, releasedAt },
    ] });
    for (let index = 0; index < phase6DemoApplications.length; index += 1) {
      await createReadyApplication(transaction, index, now);
    }
    await transaction.appointment.create({ data: {
      id: phase6DemoHolderAppointmentId,
      applicationId: phase6DemoApplications[2].id,
      applicantId: phase6DemoApplications[2].applicantId,
      slotId: phase6DemoFullSlot.id,
      status: "CONFIRMED",
      bookedAt: now,
    } });
    await transaction.applicationEvent.create({ data: {
      id: phase6DemoFixtureId("32000000", 74),
      applicationId: phase6DemoApplications[2].id,
      actorApplicantId: phase6DemoApplications[2].applicantId,
      eventType: "APPOINTMENT_BOOKED",
      correlationId: "synthetic-phase6-holder",
      createdAt: now,
    } });
    return "created";
  }, { maxWait: 15_000, timeout: 30_000 });
}
