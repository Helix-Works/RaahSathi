import { createHmac, randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  advancePhase7Hero,
  phase7HeroApplicants,
  phase7HeroApplications,
  phase7HeroAppointments,
  phase7HeroConfirmation,
  phase7HeroLicence,
  phase7HeroSlots,
  releasePhase7HeroSlot,
  resetPhase7Hero,
} from "../../../prisma/phase7-hero-seed";
import { getApplication } from "@/server/applications/application-service";
import { isDisposableDatabaseApproved } from "@/server/auth/database-test-safety";
import { createDatabaseTestClient } from "@/server/database/database-test-client";

const testUrl = process.env.TEST_DATABASE_URL;
const approved = isDisposableDatabaseApproved({
  testDatabaseUrl: testUrl,
  primaryDatabaseUrl: process.env.DATABASE_URL,
  confirmation: process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION,
});
if ((testUrl || process.env.TEST_DATABASE_DISPOSABLE_CONFIRMATION) && !approved) {
  throw new Error("Refusing Phase 7 hero tests: database identities are not safely distinct.");
}
const database = approved ? createDatabaseTestClient(testUrl) : undefined;
const pepper = process.env.AUTH_MOBILE_LOOKUP_PEPPER ?? "phase-7-hero-test-mobile-pepper-at-least-32-characters";
const fixtureNow = new Date("2026-08-27T10:00:00.000Z");
const heroContext = { sessionId: randomUUID(), applicantId: phase7HeroApplicants.hero.id };

describe.skipIf(!database)("Phase 7 deterministic hero fixture", () => {
  beforeAll(async () => {
    if (!database) return;
    await resetPhase7Hero(database, pepper, phase7HeroConfirmation, fixtureNow);
  });
  afterAll(async () => {
    await database?.$disconnect();
  });

  it("resets to the durable partial learner state without a licence or Permanent DL", async () => {
    if (!database) return;
    const learner = await getApplication(heroContext, phase7HeroApplications.learner.id, database);
    expect(learner).toMatchObject({
      statusCode: "IN_PROGRESS",
      nextActionCode: "COMPLETE_ADDRESS",
      progressPercent: 25,
    });
    expect(learner.sections.find(({ sectionKey }) => sectionKey === "ADDRESS")).toMatchObject({ completed: false });
    const learnerFixture = await database.application.findUniqueOrThrow({
      where: { id: phase7HeroApplications.learner.id },
      include: { sections: true },
    });
    expect(learnerFixture.createdAt).toEqual(fixtureNow);
    expect(learnerFixture.sections.every(({ createdAt }) => createdAt.getTime() === fixtureNow.getTime())).toBe(true);
    expect(await database.application.count({ where: { id: phase7HeroApplications.permanent.id } })).toBe(0);
    expect(await database.licenceRecord.count({ where: { applicantId: phase7HeroApplicants.hero.id } })).toBe(0);
    expect(await database.session.count({ where: { applicantId: phase7HeroApplicants.hero.id } })).toBe(0);
  });

  it("preserves the active session and derives Permanent DL appointment readiness", async () => {
    if (!database) return;
    const sessionId = randomUUID();
    const sessionNow = new Date();
    await database.session.create({
      data: {
        id: sessionId,
        applicantId: phase7HeroApplicants.hero.id,
        tokenHash: `phase7-${sessionId}`,
        csrfSecretHash: `phase7-csrf-${sessionId}`,
        idleExpiresAt: new Date(sessionNow.getTime() + 60 * 60 * 1000),
        absoluteExpiresAt: new Date(sessionNow.getTime() + 2 * 60 * 60 * 1000),
      },
    });

    expect(await advancePhase7Hero(database, phase7HeroConfirmation, fixtureNow)).toBe("created");
    expect(await advancePhase7Hero(database, phase7HeroConfirmation, fixtureNow)).toBe("unchanged");
    expect(await database.session.count({ where: { id: sessionId, revokedAt: null } })).toBe(1);
    expect(await getApplication(heroContext, phase7HeroApplications.permanent.id, database)).toMatchObject({
      serviceKey: "PERMANENT_DRIVING_LICENCE",
      statusCode: "READY_FOR_APPOINTMENT",
      nextActionCode: "SELECT_APPOINTMENT",
      progressPercent: 100,
    });
    const permanentFixture = await database.application.findUniqueOrThrow({
      where: { id: phase7HeroApplications.permanent.id },
      include: { sections: true, events: true, identityAttempts: true, feeSnapshot: true, paymentAttempts: true },
    });
    expect(permanentFixture.createdAt).toEqual(fixtureNow);
    expect(permanentFixture.sections.every(({ createdAt }) => createdAt.getTime() === fixtureNow.getTime())).toBe(true);
    expect(permanentFixture.events.every(({ createdAt }) => createdAt.getTime() === fixtureNow.getTime())).toBe(true);
    expect(permanentFixture.identityAttempts.every(({ createdAt }) => createdAt.getTime() === fixtureNow.getTime())).toBe(true);
    expect(permanentFixture.feeSnapshot?.createdAt).toEqual(fixtureNow);
    expect(permanentFixture.paymentAttempts.map(({ createdAt }) => createdAt)).toEqual([fixtureNow]);
    const advancedLearnerSections = await database.applicationSection.findMany({
      where: {
        applicationId: phase7HeroApplications.learner.id,
        sectionKey: { in: ["SERVICE_DETAILS", "DECLARATION"] },
      },
    });
    expect(advancedLearnerSections).toHaveLength(2);
    expect(advancedLearnerSections.every(({ createdAt }) => createdAt.getTime() === fixtureNow.getTime())).toBe(true);
    expect(await database.licenceRecord.findUnique({ where: { id: phase7HeroLicence.id } })).toMatchObject({
      applicantId: phase7HeroApplicants.hero.id,
      kind: "LEARNER",
      syntheticReference: phase7HeroLicence.syntheticReference,
    });
    expect(await database.appointment.findUnique({ where: { id: phase7HeroAppointments.learner } })).toMatchObject({ status: "CONFIRMED" });
  });

  it("releases the exact holder capacity once with sanitized history", async () => {
    if (!database) return;
    expect(await releasePhase7HeroSlot(database, phase7HeroConfirmation, fixtureNow)).toBe("released");
    expect(await releasePhase7HeroSlot(database, phase7HeroConfirmation, fixtureNow)).toBe("unchanged");
    expect(await database.appointmentSlot.findUnique({ where: { id: phase7HeroSlots.full.id } })).toMatchObject({ bookedCount: 0, heldCount: 0 });
    expect(await database.appointment.findUnique({ where: { id: phase7HeroAppointments.holder } })).toMatchObject({ status: "CANCELLED" });
    const audits = await database.auditEvent.findMany({ where: { resourceId: phase7HeroAppointments.holder } });
    expect(audits).toHaveLength(1);
    expect(JSON.stringify(audits[0]?.metadata)).not.toMatch(/token|otp|secret/i);
  });

  it("keeps the fresh account free of workflow state after reset", async () => {
    if (!database) return;
    const freshApplicantId = phase7HeroApplicants.fresh.id;
    const freshMobileLookupHash = createHmac("sha256", pepper)
      .update(`+91${phase7HeroApplicants.fresh.mobile}`, "utf8")
      .digest("hex");
    const [applications, licences, appointments, waitlistEntries, sessions, authAttempts] = await Promise.all([
      database.application.count({ where: { applicantId: freshApplicantId } }),
      database.licenceRecord.count({ where: { applicantId: freshApplicantId } }),
      database.appointment.count({ where: { applicantId: freshApplicantId } }),
      database.waitlistEntry.count({ where: { applicantId: freshApplicantId } }),
      database.session.count({ where: { applicantId: freshApplicantId } }),
      database.authAttempt.count({
        where: { OR: [{ applicantId: freshApplicantId }, { mobileLookupHash: freshMobileLookupHash }] },
      }),
    ]);

    expect({ applications, licences, appointments, waitlistEntries, sessions, authAttempts }).toEqual({
      applications: 0,
      licences: 0,
      appointments: 0,
      waitlistEntries: 0,
      sessions: 0,
      authAttempts: 0,
    });
  });

  it("fails closed before deleting a fixture account with an incompatible identity", async () => {
    if (!database) return;
    await database.applicant.update({
      where: { id: phase7HeroApplicants.hero.id },
      data: { displayName: "Unexpected account" },
    });
    try {
      await expect(resetPhase7Hero(database, pepper, phase7HeroConfirmation, fixtureNow))
        .rejects.toThrow(/fixture conflict/i);
      expect(await database.application.findUnique({ where: { id: phase7HeroApplications.learner.id } }))
        .not.toBeNull();
    } finally {
      await database.applicant.update({
        where: { id: phase7HeroApplicants.hero.id },
        data: { displayName: phase7HeroApplicants.hero.name },
      });
    }
  });

  it("fails closed for an authentication attempt with a foreign lookup hash", async () => {
    if (!database) return;
    const attemptId = randomUUID();
    const attemptNow = new Date();
    await database.authAttempt.create({
      data: {
        id: attemptId,
        applicantId: phase7HeroApplicants.hero.id,
        mobileLookupHash: "foreign-phase7-authentication-attempt-hash",
        otpHash: "synthetic-test-otp-hash",
        otpSalt: "synthetic-test-otp-salt",
        attemptsRemaining: 3,
        expiresAt: new Date(attemptNow.getTime() + 10 * 60 * 1000),
        resendAvailableAt: new Date(attemptNow.getTime() + 2 * 60 * 1000),
      },
    });
    try {
      await expect(resetPhase7Hero(database, pepper, phase7HeroConfirmation, fixtureNow))
        .rejects.toThrow(/fixture conflict/i);
      expect(await database.authAttempt.findUnique({ where: { id: attemptId } })).not.toBeNull();
    } finally {
      await database.authAttempt.delete({ where: { id: attemptId } });
    }
  });
});
