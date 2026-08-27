import { createHmac } from "node:crypto";

import { Prisma, type PrismaClient } from "@prisma/client";

export const phase7HeroConfirmation = "RESET_PHASE7_HERO_SYNTHETIC_RECORDS";
export const phase7HeroSeedLockKey = "raahsathi:seed:phase7-hero";

export const phase7HeroApplicants = {
  hero: {
    id: "10000000-0000-4000-8000-000000000007",
    mobile: "9000000007",
    name: "Phase 7 Hero Citizen",
  },
  holder: {
    id: "10000000-0000-4000-8000-000000000008",
    mobile: "9000000008",
    name: "Phase 7 Capacity Holder",
  },
} as const;

export const phase7HeroApplications = {
  learner: {
    id: "30000000-0000-4000-8000-000000000006",
    applicantId: phase7HeroApplicants.hero.id,
    serviceKey: "LEARNER_LICENCE" as const,
  },
  permanent: {
    id: "30000000-0000-4000-8000-000000000007",
    applicantId: phase7HeroApplicants.hero.id,
    serviceKey: "PERMANENT_DRIVING_LICENCE" as const,
  },
  holder: {
    id: "30000000-0000-4000-8000-000000000008",
    applicantId: phase7HeroApplicants.holder.id,
    serviceKey: "PERMANENT_DRIVING_LICENCE" as const,
  },
} as const;

export const phase7HeroRto = {
  id: "50000000-0000-4000-8000-000000000007",
  code: "SYNTHETIC_HERO_ROHINI",
  nameEn: "Synthetic Rohini Hero RTO",
  nameHi: "कृत्रिम रोहिणी हीरो आरटीओ",
  district: "Synthetic Delhi",
} as const;

export const phase7HeroSlots = {
  learner: {
    id: "51000000-0000-4000-8000-000000000006",
    startTime: "08:30",
    endTime: "09:00",
  },
  full: {
    id: "51000000-0000-4000-8000-000000000007",
    startTime: "09:00",
    endTime: "09:30",
  },
  unreleased: {
    id: "51000000-0000-4000-8000-000000000008",
    startTime: "09:00",
    endTime: "09:30",
  },
} as const;

export const phase7HeroAppointments = {
  learner: "52000000-0000-4000-8000-000000000007",
  holder: "52000000-0000-4000-8000-000000000008",
} as const;

export const phase7HeroLicence = {
  id: "33000000-0000-4000-8000-000000000007",
  syntheticReference: "SYN-LL-PHASE7-0007",
} as const;

export const phase7HeroWaitlistId = "53000000-0000-4000-8000-000000000007";
export const phase7HeroOfferId = "54000000-0000-4000-8000-000000000007";

export function phase7HeroFixtureId(prefix: string, ordinal: number): string {
  return `${prefix}-0000-4000-8000-${String(7_000 + ordinal).padStart(12, "0")}`;
}

export function phase7HeroSchedule(now: Date): Readonly<{
  learnerDate: Date;
  fullDate: Date;
  unreleasedDate: Date;
  releasedAt: Date;
}> {
  const dateKey = (offset: number) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() + offset);
    return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
  };
  return {
    learnerDate: dateKey(0),
    fullDate: dateKey(1),
    unreleasedDate: dateKey(2),
    releasedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
  };
}

export function phase7HeroSeedNow(value: string | undefined, fallback = new Date()): Date {
  if (value === undefined || value === "") return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("RAAHSATHI_DEMO_SEED_DATE must use YYYY-MM-DD.");
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("RAAHSATHI_DEMO_SEED_DATE must be a real calendar date.");
  }
  parsed.setUTCHours(
    fallback.getUTCHours(),
    fallback.getUTCMinutes(),
    fallback.getUTCSeconds(),
    fallback.getUTCMilliseconds(),
  );
  return parsed;
}

export function assertPhase7HeroConfirmation(value: string | undefined): void {
  if (value !== phase7HeroConfirmation) {
    throw new Error(`RAAHSATHI_DEMO_RESET_CONFIRMATION must equal ${phase7HeroConfirmation}.`);
  }
}

function lookupHash(mobileNumber: string, pepper: string): string {
  return createHmac("sha256", pepper).update(`+91${mobileNumber}`, "utf8").digest("hex");
}

function paymentFixture(applicationId: string, ordinal: number) {
  const paymentAttemptId = phase7HeroFixtureId("42000000", ordinal);
  return {
    feeSnapshotId: phase7HeroFixtureId("41000000", ordinal),
    paymentAttemptId,
    idempotencyKey: phase7HeroFixtureId("43000000", ordinal),
    providerReference: `SYN-PAY-${paymentAttemptId.toUpperCase()}`,
    applicationId,
  } as const;
}

export const phase7HeroPayments = {
  learner: paymentFixture(phase7HeroApplications.learner.id, 71),
  permanent: paymentFixture(phase7HeroApplications.permanent.id, 72),
  holder: paymentFixture(phase7HeroApplications.holder.id, 73),
} as const;

function completedSections(name: string, learnerReference?: string) {
  return [
    { sectionKey: "PERSONAL_DETAILS" as const, data: { fullName: name, dateOfBirth: "1995-01-15" } },
    { sectionKey: "ADDRESS" as const, data: { district: "NORTH_WEST", postalCode: "110085" } },
    {
      sectionKey: "SERVICE_DETAILS" as const,
      data: learnerReference
        ? { vehicleClass: "LMV", learnerLicenceReference: learnerReference }
        : { vehicleClass: "LMV" },
    },
    { sectionKey: "DECLARATION" as const, data: { accepted: true } },
  ];
}

async function createCompletedApplication(
  transaction: Prisma.TransactionClient,
  input: Readonly<{
    application: (typeof phase7HeroApplications)[keyof typeof phase7HeroApplications];
    applicantName: string;
    payment: (typeof phase7HeroPayments)[keyof typeof phase7HeroPayments];
    ordinalBase: number;
    now: Date;
    status: "READY_FOR_APPOINTMENT" | "APPOINTMENT_BOOKED";
    learnerReference?: string;
  }>,
): Promise<void> {
  const correlationId = `synthetic-phase7-${input.ordinalBase}`;
  await transaction.application.create({
    data: {
      id: input.application.id,
      applicantId: input.application.applicantId,
      serviceKey: input.application.serviceKey,
      status: input.status,
      identityScenario: "SUCCESS",
      paymentScenario: "SUCCESS",
      createdAt: input.now,
      sections: {
        create: completedSections(input.applicantName, input.learnerReference).map((section, index) => ({
          id: phase7HeroFixtureId("31000000", input.ordinalBase + index),
          ...section,
          completedAt: input.now,
          createdAt: input.now,
        })),
      },
      events: {
        create: [
          { id: phase7HeroFixtureId("32000000", input.ordinalBase), actorApplicantId: input.application.applicantId, eventType: "APPLICATION_CREATED", correlationId, createdAt: input.now },
          { id: phase7HeroFixtureId("32000000", input.ordinalBase + 1), actorApplicantId: input.application.applicantId, eventType: "WORKFLOW_ADVANCED", correlationId, createdAt: input.now },
          { id: phase7HeroFixtureId("32000000", input.ordinalBase + 2), actorApplicantId: input.application.applicantId, eventType: "IDENTITY_VERIFIED", correlationId, createdAt: input.now },
          { id: phase7HeroFixtureId("32000000", input.ordinalBase + 3), actorApplicantId: input.application.applicantId, eventType: "PAYMENT_SUCCEEDED", correlationId, createdAt: input.now },
        ],
      },
      identityAttempts: {
        create: {
          id: phase7HeroFixtureId("34000000", input.ordinalBase),
          outcome: "VERIFIED",
          attemptNumber: 1,
          correlationId,
          createdAt: input.now,
        },
      },
    },
  });
  await transaction.feeSnapshot.create({
    data: {
      id: input.payment.feeSnapshotId,
      applicationId: input.application.id,
      baseFeeMinor: 50_000,
      serviceChargeMinor: 5_000,
      totalAmountMinor: 55_000,
      currency: "INR",
      createdAt: input.now,
    },
  });
  await transaction.paymentAttempt.create({
    data: {
      id: input.payment.paymentAttemptId,
      applicationId: input.application.id,
      feeSnapshotId: input.payment.feeSnapshotId,
      attemptNumber: 1,
      idempotencyKey: input.payment.idempotencyKey,
      providerReference: input.payment.providerReference,
      status: "SUCCEEDED",
      amountMinor: 55_000,
      succeededAt: input.now,
      createdAt: input.now,
    },
  });
}

function assertFixture(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 7 hero fixture conflict: ${message}`);
}

/**
 * Reset is the only destructive Phase 7 command. Before removing records, prove
 * every connected record belongs to the two deterministic synthetic accounts,
 * applications, slots, and RTO. Any unexpected relationship leaves the whole
 * transaction untouched instead of broadening fixture cleanup.
 */
async function assertResettablePhase7Fixture(
  transaction: Prisma.TransactionClient,
  mobileLookupHashes: readonly string[],
): Promise<void> {
  const applicantIds: string[] = Object.values(phase7HeroApplicants).map(({ id }) => id);
  const applicationIds: string[] = Object.values(phase7HeroApplications).map(({ id }) => id);
  const slotIds: string[] = Object.values(phase7HeroSlots).map(({ id }) => id);
  const expectedApplications = new Map<string, (typeof phase7HeroApplications)[keyof typeof phase7HeroApplications]>(
    Object.values(phase7HeroApplications).map((application) => [application.id, application]),
  );
  const expectedApplicants = new Map<string, (typeof phase7HeroApplicants)[keyof typeof phase7HeroApplicants]>(
    Object.values(phase7HeroApplicants).map((applicant) => [applicant.id, applicant]),
  );

  const [applicants, applications, licences, rtos, slots, appointments, waitlistEntries, slotOffers, authAttempts, releaseAudits] = await Promise.all([
    transaction.applicant.findMany({
      where: { OR: [{ id: { in: applicantIds } }, { mobileLookupHash: { in: [...mobileLookupHashes] } }] },
      select: { id: true, mobileLookupHash: true, mobileLast4: true, displayName: true, authScenario: true },
    }),
    transaction.application.findMany({
      where: { applicantId: { in: applicantIds } },
      select: { id: true, applicantId: true, serviceKey: true },
    }),
    transaction.licenceRecord.findMany({
      where: { applicantId: { in: applicantIds } },
      select: { id: true, applicantId: true, kind: true, vehicleClass: true, syntheticReference: true },
    }),
    transaction.rto.findMany({
      where: { OR: [{ id: phase7HeroRto.id }, { code: phase7HeroRto.code }] },
      select: {
        id: true,
        code: true,
        slots: { select: { id: true } },
        waitlistEntries: { select: { applicationId: true, applicantId: true } },
      },
    }),
    transaction.appointmentSlot.findMany({
      where: { id: { in: slotIds } },
      select: { id: true, rtoId: true, serviceKey: true, startTime: true, endTime: true, vehicleClass: true },
    }),
    transaction.appointment.findMany({
      where: { OR: [{ applicationId: { in: applicationIds } }, { applicantId: { in: applicantIds } }, { slotId: { in: slotIds } }] },
      select: { applicationId: true, applicantId: true, slotId: true },
    }),
    transaction.waitlistEntry.findMany({
      where: { OR: [{ applicationId: { in: applicationIds } }, { applicantId: { in: applicantIds } }, { rtoId: phase7HeroRto.id }] },
      select: { id: true, applicationId: true, applicantId: true, rtoId: true, serviceKey: true, vehicleClass: true },
    }),
    transaction.slotOffer.findMany({
      where: { OR: [{ slotId: { in: slotIds } }, { waitlistEntry: { applicationId: { in: applicationIds } } }] },
      select: { waitlistEntryId: true, slotId: true, waitlistEntry: { select: { applicationId: true, applicantId: true, rtoId: true } } },
    }),
    transaction.authAttempt.findMany({
      where: { OR: [{ applicantId: { in: applicantIds } }, { mobileLookupHash: { in: [...mobileLookupHashes] } }] },
      select: { applicantId: true, mobileLookupHash: true },
    }),
    transaction.auditEvent.findMany({
      where: { id: phase7HeroFixtureId("44000000", 71) },
      select: { actorApplicantId: true, eventType: true, resourceType: true, resourceId: true, correlationId: true },
    }),
  ]);

  for (const applicant of applicants) {
    const expected = expectedApplicants.get(applicant.id);
    assertFixture(expected !== undefined && applicant.mobileLast4 === expected.mobile.slice(-4) && applicant.displayName === expected.name
      && applicant.authScenario === "STANDARD", "an applicant identity is not the expected synthetic account");
  }
  for (const application of applications) {
    const expected = expectedApplications.get(application.id);
    assertFixture(expected !== undefined && expected.applicantId === application.applicantId
      && expected.serviceKey === application.serviceKey, "an application linked to a fixture applicant is not deterministic");
  }
  for (const licence of licences) {
    assertFixture(licence.id === phase7HeroLicence.id && licence.applicantId === phase7HeroApplicants.hero.id
      && licence.kind === "LEARNER" && licence.vehicleClass === "LMV"
      && licence.syntheticReference === phase7HeroLicence.syntheticReference,
    "a licence linked to a fixture applicant is not deterministic");
  }
  assertFixture(rtos.length <= 1, "the fixture RTO id and code resolve to different records");
  for (const rto of rtos) {
    assertFixture(rto.id === phase7HeroRto.id && rto.code === phase7HeroRto.code, "the fixture RTO identity is not deterministic");
    assertFixture(rto.slots.every((slot) => slotIds.includes(slot.id)), "the fixture RTO has a non-fixture slot");
    assertFixture(rto.waitlistEntries.every((entry) => applicationIds.includes(entry.applicationId)
      && applicantIds.includes(entry.applicantId)), "the fixture RTO has a non-fixture waitlist entry");
  }
  for (const slot of slots) {
    const expected = slot.id === phase7HeroSlots.learner.id
      ? { serviceKey: "LEARNER_LICENCE", startTime: phase7HeroSlots.learner.startTime, endTime: phase7HeroSlots.learner.endTime }
      : { serviceKey: "PERMANENT_DRIVING_LICENCE", startTime: phase7HeroSlots.full.startTime, endTime: phase7HeroSlots.full.endTime };
    assertFixture(slot.rtoId === phase7HeroRto.id && slot.serviceKey === expected.serviceKey
      && slot.startTime === expected.startTime && slot.endTime === expected.endTime && slot.vehicleClass === "LMV",
    "a fixture slot has unexpected ownership or shape");
  }
  for (const appointment of appointments) {
    assertFixture(applicationIds.includes(appointment.applicationId) && applicantIds.includes(appointment.applicantId)
      && slotIds.includes(appointment.slotId), "an appointment touching the fixture is not deterministic");
  }
  for (const entry of waitlistEntries) {
    const application = expectedApplications.get(entry.applicationId);
    assertFixture(application !== undefined && application.applicantId === entry.applicantId && entry.rtoId === phase7HeroRto.id
      && application.serviceKey === entry.serviceKey && entry.vehicleClass === "LMV",
    "a waitlist entry touching the fixture is not deterministic");
  }
  for (const offer of slotOffers) {
    assertFixture(applicationIds.includes(offer.waitlistEntry.applicationId)
      && applicantIds.includes(offer.waitlistEntry.applicantId) && offer.waitlistEntry.rtoId === phase7HeroRto.id
      && slotIds.includes(offer.slotId), "a slot offer touching the fixture is not deterministic");
  }
  for (const attempt of authAttempts) {
    assertFixture(applicantIds.includes(attempt.applicantId ?? "") || mobileLookupHashes.includes(attempt.mobileLookupHash),
    "an authentication attempt touching the fixture is not deterministic");
  }
  for (const audit of releaseAudits) {
    assertFixture(audit.actorApplicantId === phase7HeroApplicants.holder.id && audit.eventType === "APPOINTMENT_CANCELLED"
      && audit.resourceType === "Appointment" && audit.resourceId === phase7HeroAppointments.holder
      && audit.correlationId === "synthetic-phase7-release", "the deterministic release audit is incompatible");
  }
}

async function removePhase7Records(
  transaction: Prisma.TransactionClient,
  mobileLookupHashes: readonly string[],
): Promise<void> {
  const applicantIds = Object.values(phase7HeroApplicants).map(({ id }) => id);
  const applicationIds = Object.values(phase7HeroApplications).map(({ id }) => id);
  const slotIds = Object.values(phase7HeroSlots).map(({ id }) => id);
  const appointmentIds = Object.values(phase7HeroAppointments);

  await transaction.auditEvent.deleteMany({ where: { id: phase7HeroFixtureId("44000000", 71) } });
  await transaction.authAttempt.deleteMany({
    where: { OR: [{ applicantId: { in: applicantIds } }, { mobileLookupHash: { in: [...mobileLookupHashes] } }] },
  });
  await transaction.session.deleteMany({ where: { applicantId: { in: applicantIds } } });
  await transaction.appointmentRateLimitBucket.deleteMany({ where: { applicantId: { in: applicantIds } } });
  await transaction.waitlistRateLimitBucket.deleteMany({ where: { applicantId: { in: applicantIds } } });
  await transaction.slotOffer.deleteMany({
    where: { OR: [{ waitlistEntryId: phase7HeroWaitlistId }, { slotId: { in: slotIds } }] },
  });
  await transaction.waitlistEntry.deleteMany({
    where: { OR: [{ id: phase7HeroWaitlistId }, { applicationId: { in: applicationIds } }] },
  });
  await transaction.appointment.deleteMany({
    where: { OR: [{ id: { in: appointmentIds } }, { applicationId: { in: applicationIds } }] },
  });
  await transaction.application.deleteMany({ where: { id: { in: applicationIds } } });
  await transaction.licenceRecord.deleteMany({
    where: { OR: [{ id: phase7HeroLicence.id }, { applicantId: { in: applicantIds } }] },
  });
  await transaction.appointmentSlot.deleteMany({ where: { id: { in: slotIds } } });
  await transaction.applicant.deleteMany({ where: { id: { in: applicantIds } } });
}

export async function resetPhase7Hero(
  database: PrismaClient,
  pepper: string,
  confirmation: string | undefined,
  now = new Date(),
): Promise<void> {
  assertPhase7HeroConfirmation(confirmation);
  if (pepper.length < 32) throw new Error("AUTH_MOBILE_LOOKUP_PEPPER must contain at least 32 characters.");
  const applicants = Object.values(phase7HeroApplicants).map((applicant) => ({
    ...applicant,
    mobileLookupHash: lookupHash(applicant.mobile, pepper),
  }));
  const schedule = phase7HeroSchedule(now);

  await database.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${phase7HeroSeedLockKey}))::text`;
    const conflicts = await transaction.applicant.findMany({
      where: {
        OR: [
          { id: { in: applicants.map(({ id }) => id) } },
          { mobileLookupHash: { in: applicants.map(({ mobileLookupHash }) => mobileLookupHash) } },
        ],
      },
      select: { id: true, mobileLookupHash: true },
    });
    if (conflicts.some((record) => !applicants.some((expected) => expected.id === record.id))) {
      throw new Error("Phase 7 hero identifiers conflict with records outside the enumerated synthetic fixture.");
    }

    await assertResettablePhase7Fixture(transaction, applicants.map(({ mobileLookupHash }) => mobileLookupHash));
    await removePhase7Records(transaction, applicants.map(({ mobileLookupHash }) => mobileLookupHash));

    const existingRto = await transaction.rto.findFirst({
      where: { OR: [{ id: phase7HeroRto.id }, { code: phase7HeroRto.code }] },
    });
    if (existingRto && (existingRto.id !== phase7HeroRto.id || existingRto.code !== phase7HeroRto.code)) {
      throw new Error("Phase 7 hero RTO identifiers conflict with an unrelated record.");
    }
    await transaction.rto.upsert({
      where: { id: phase7HeroRto.id },
      create: phase7HeroRto,
      update: {
        nameEn: phase7HeroRto.nameEn,
        nameHi: phase7HeroRto.nameHi,
        district: phase7HeroRto.district,
        operationalStatus: "AVAILABLE",
        bookingServiceStatus: "AVAILABLE",
      },
    });
    await transaction.applicant.createMany({
      data: applicants.map((applicant) => ({
        id: applicant.id,
        mobileLookupHash: applicant.mobileLookupHash,
        mobileLast4: applicant.mobile.slice(-4),
        displayName: applicant.name,
        authScenario: "STANDARD",
      })),
    });
    await transaction.appointmentSlot.createMany({
      data: [
        {
          ...phase7HeroSlots.learner,
          rtoId: phase7HeroRto.id,
          serviceKey: "LEARNER_LICENCE",
          date: schedule.learnerDate,
          capacity: 1,
          bookedCount: 0,
          releasedAt: schedule.releasedAt,
        },
        {
          ...phase7HeroSlots.full,
          rtoId: phase7HeroRto.id,
          serviceKey: "PERMANENT_DRIVING_LICENCE",
          date: schedule.fullDate,
          capacity: 1,
          bookedCount: 1,
          releasedAt: schedule.releasedAt,
        },
        {
          ...phase7HeroSlots.unreleased,
          rtoId: phase7HeroRto.id,
          serviceKey: "PERMANENT_DRIVING_LICENCE",
          date: schedule.unreleasedDate,
          capacity: 1,
          bookedCount: 0,
          releasedAt: null,
        },
      ],
    });
    await transaction.application.create({
      data: {
        id: phase7HeroApplications.learner.id,
        applicantId: phase7HeroApplicants.hero.id,
        serviceKey: "LEARNER_LICENCE",
        status: "IN_PROGRESS",
        identityScenario: "SUCCESS",
        paymentScenario: "SUCCESS",
        createdAt: now,
        sections: {
          create: [
            {
              id: phase7HeroFixtureId("31000000", 61),
              sectionKey: "PERSONAL_DETAILS",
              data: { fullName: phase7HeroApplicants.hero.name, dateOfBirth: "1995-01-15" },
              completedAt: now,
              createdAt: now,
            },
            {
              id: phase7HeroFixtureId("31000000", 62),
              sectionKey: "ADDRESS",
              data: { district: "NORTH_WEST", postalCode: "110085" },
              createdAt: now,
            },
          ],
        },
        events: {
          create: [
            { id: phase7HeroFixtureId("32000000", 61), actorApplicantId: phase7HeroApplicants.hero.id, eventType: "APPLICATION_CREATED", correlationId: "synthetic-phase7-reset", createdAt: now },
            { id: phase7HeroFixtureId("32000000", 62), actorApplicantId: phase7HeroApplicants.hero.id, eventType: "SECTION_COMPLETED", sectionKey: "PERSONAL_DETAILS", correlationId: "synthetic-phase7-reset", createdAt: now },
            { id: phase7HeroFixtureId("32000000", 63), actorApplicantId: phase7HeroApplicants.hero.id, eventType: "SECTION_SAVED", sectionKey: "ADDRESS", correlationId: "synthetic-phase7-reset", createdAt: now },
          ],
        },
      },
    });
    await createCompletedApplication(transaction, {
      application: phase7HeroApplications.holder,
      applicantName: phase7HeroApplicants.holder.name,
      payment: phase7HeroPayments.holder,
      ordinalBase: 90,
      now,
      status: "APPOINTMENT_BOOKED",
      learnerReference: "SYN-LL-PHASE7-HOLDER",
    });
    await transaction.appointment.create({
      data: {
        id: phase7HeroAppointments.holder,
        applicationId: phase7HeroApplications.holder.id,
        applicantId: phase7HeroApplicants.holder.id,
        slotId: phase7HeroSlots.full.id,
        status: "CONFIRMED",
        bookedAt: now,
      },
    });
    await transaction.applicationEvent.create({
      data: {
        id: phase7HeroFixtureId("32000000", 94),
        applicationId: phase7HeroApplications.holder.id,
        actorApplicantId: phase7HeroApplicants.holder.id,
        eventType: "APPOINTMENT_BOOKED",
        correlationId: "synthetic-phase7-holder",
        createdAt: now,
      },
    });
  }, { maxWait: 15_000, timeout: 30_000 });
}

export async function advancePhase7Hero(
  database: PrismaClient,
  confirmation: string | undefined,
  now = new Date(),
): Promise<"created" | "unchanged"> {
  assertPhase7HeroConfirmation(confirmation);
  return database.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${phase7HeroSeedLockKey}))::text`;
    await transaction.$queryRaw`SELECT "id" FROM "Application" WHERE "id" = ${phase7HeroApplications.learner.id}::uuid FOR UPDATE`;
    const learner = await transaction.application.findUnique({ where: { id: phase7HeroApplications.learner.id } });
    if (!learner || learner.applicantId !== phase7HeroApplicants.hero.id || learner.serviceKey !== "LEARNER_LICENCE") {
      throw new Error("Reset the Phase 7 hero fixture before advancing it.");
    }
    const permanent = await transaction.application.findUnique({ where: { id: phase7HeroApplications.permanent.id } });
    if (permanent) {
      if (permanent.applicantId !== phase7HeroApplicants.hero.id || permanent.serviceKey !== "PERMANENT_DRIVING_LICENCE") {
        throw new Error("The Phase 7 Permanent DL identifier is incompatible.");
      }
      return "unchanged";
    }

    await transaction.applicationSection.update({
      where: { applicationId_sectionKey: { applicationId: learner.id, sectionKey: "ADDRESS" } },
      data: { completedAt: now },
    });
    await transaction.applicationSection.createMany({
      data: [
        { id: phase7HeroFixtureId("31000000", 63), applicationId: learner.id, sectionKey: "SERVICE_DETAILS", data: { vehicleClass: "LMV" }, completedAt: now, createdAt: now },
        { id: phase7HeroFixtureId("31000000", 64), applicationId: learner.id, sectionKey: "DECLARATION", data: { accepted: true }, completedAt: now, createdAt: now },
      ],
    });
    await transaction.applicationEvent.createMany({
      data: [
        { id: phase7HeroFixtureId("32000000", 64), applicationId: learner.id, actorApplicantId: phase7HeroApplicants.hero.id, eventType: "SECTION_COMPLETED", sectionKey: "ADDRESS", correlationId: "synthetic-phase7-milestone", createdAt: now },
        { id: phase7HeroFixtureId("32000000", 65), applicationId: learner.id, actorApplicantId: phase7HeroApplicants.hero.id, eventType: "SECTION_COMPLETED", sectionKey: "SERVICE_DETAILS", correlationId: "synthetic-phase7-milestone", createdAt: now },
        { id: phase7HeroFixtureId("32000000", 66), applicationId: learner.id, actorApplicantId: phase7HeroApplicants.hero.id, eventType: "SECTION_COMPLETED", sectionKey: "DECLARATION", correlationId: "synthetic-phase7-milestone", createdAt: now },
        { id: phase7HeroFixtureId("32000000", 67), applicationId: learner.id, actorApplicantId: phase7HeroApplicants.hero.id, eventType: "WORKFLOW_ADVANCED", correlationId: "synthetic-phase7-milestone", createdAt: now },
        { id: phase7HeroFixtureId("32000000", 68), applicationId: learner.id, actorApplicantId: phase7HeroApplicants.hero.id, eventType: "IDENTITY_VERIFIED", correlationId: "synthetic-phase7-milestone", createdAt: now },
        { id: phase7HeroFixtureId("32000000", 69), applicationId: learner.id, actorApplicantId: phase7HeroApplicants.hero.id, eventType: "PAYMENT_SUCCEEDED", correlationId: "synthetic-phase7-milestone", createdAt: now },
        { id: phase7HeroFixtureId("32000000", 70), applicationId: learner.id, actorApplicantId: phase7HeroApplicants.hero.id, eventType: "APPOINTMENT_BOOKED", correlationId: "synthetic-phase7-milestone", createdAt: now },
      ],
    });
    await transaction.identityAttempt.create({
      data: { id: phase7HeroFixtureId("34000000", 61), applicationId: learner.id, outcome: "VERIFIED", attemptNumber: 1, correlationId: "synthetic-phase7-milestone", createdAt: now },
    });
    await transaction.feeSnapshot.create({
      data: { id: phase7HeroPayments.learner.feeSnapshotId, applicationId: learner.id, baseFeeMinor: 50_000, serviceChargeMinor: 5_000, totalAmountMinor: 55_000, currency: "INR", createdAt: now },
    });
    await transaction.paymentAttempt.create({
      data: { id: phase7HeroPayments.learner.paymentAttemptId, applicationId: learner.id, feeSnapshotId: phase7HeroPayments.learner.feeSnapshotId, attemptNumber: 1, idempotencyKey: phase7HeroPayments.learner.idempotencyKey, providerReference: phase7HeroPayments.learner.providerReference, status: "SUCCEEDED", amountMinor: 55_000, succeededAt: now, createdAt: now },
    });
    await transaction.appointmentSlot.update({ where: { id: phase7HeroSlots.learner.id }, data: { bookedCount: 1 } });
    await transaction.appointment.create({
      data: { id: phase7HeroAppointments.learner, applicationId: learner.id, applicantId: phase7HeroApplicants.hero.id, slotId: phase7HeroSlots.learner.id, status: "CONFIRMED", bookedAt: now },
    });
    await transaction.licenceRecord.create({
      data: {
        ...phase7HeroLicence,
        applicantId: phase7HeroApplicants.hero.id,
        kind: "LEARNER",
        vehicleClass: "LMV",
        issuedAt: now,
        validUntil: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      },
    });
    await transaction.application.update({ where: { id: learner.id }, data: { status: "APPOINTMENT_BOOKED" } });
    await createCompletedApplication(transaction, {
      application: phase7HeroApplications.permanent,
      applicantName: phase7HeroApplicants.hero.name,
      payment: phase7HeroPayments.permanent,
      ordinalBase: 80,
      now,
      status: "READY_FOR_APPOINTMENT",
      learnerReference: phase7HeroLicence.syntheticReference,
    });
    return "created";
  }, { maxWait: 15_000, timeout: 30_000 });
}

export async function releasePhase7HeroSlot(
  database: PrismaClient,
  confirmation: string | undefined,
  now = new Date(),
): Promise<"released" | "unchanged"> {
  assertPhase7HeroConfirmation(confirmation);
  return database.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${phase7HeroSeedLockKey}))::text`;
    await transaction.$queryRaw`SELECT "id" FROM "Appointment" WHERE "id" = ${phase7HeroAppointments.holder}::uuid FOR UPDATE`;
    await transaction.$queryRaw`SELECT "id" FROM "AppointmentSlot" WHERE "id" = ${phase7HeroSlots.full.id}::uuid FOR UPDATE`;
    const appointment = await transaction.appointment.findUnique({ where: { id: phase7HeroAppointments.holder } });
    if (!appointment || appointment.applicationId !== phase7HeroApplications.holder.id
      || appointment.applicantId !== phase7HeroApplicants.holder.id || appointment.slotId !== phase7HeroSlots.full.id) {
      throw new Error("The Phase 7 capacity-holder fixture is missing or incompatible.");
    }
    if (appointment.status === "CANCELLED") return "unchanged";
    const slotChanged = await transaction.appointmentSlot.updateMany({
      where: { id: phase7HeroSlots.full.id, bookedCount: 1, heldCount: 0 },
      data: { bookedCount: { decrement: 1 } },
    });
    if (slotChanged.count !== 1) throw new Error("The Phase 7 full-slot capacity invariant is inconsistent.");
    await transaction.appointment.update({
      where: { id: phase7HeroAppointments.holder },
      data: { status: "CANCELLED", cancelledAt: now },
    });
    await transaction.application.update({ where: { id: phase7HeroApplications.holder.id }, data: { status: "READY_FOR_APPOINTMENT" } });
    await transaction.applicationEvent.create({
      data: { id: phase7HeroFixtureId("32000000", 95), applicationId: phase7HeroApplications.holder.id, actorApplicantId: phase7HeroApplicants.holder.id, eventType: "APPOINTMENT_CANCELLED", correlationId: "synthetic-phase7-release", createdAt: now },
    });
    await transaction.auditEvent.create({
      data: {
        id: phase7HeroFixtureId("44000000", 71),
        actorApplicantId: phase7HeroApplicants.holder.id,
        eventType: "APPOINTMENT_CANCELLED",
        resourceType: "Appointment",
        resourceId: phase7HeroAppointments.holder,
        correlationId: "synthetic-phase7-release",
        metadata: { applicationId: phase7HeroApplications.holder.id, slotId: phase7HeroSlots.full.id, fixtureAction: "RELEASE_HERO_CAPACITY" },
        createdAt: now,
      },
    });
    return "released";
  }, { maxWait: 15_000, timeout: 30_000 });
}
