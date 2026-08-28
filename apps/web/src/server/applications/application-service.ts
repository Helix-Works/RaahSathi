import "server-only";

import {
  addressDataSchema,
  applicationDetailSchema,
  applicationListSchema,
  applicationSectionOrder,
  applicationSummarySchema,
  declarationDataSchema,
  personalDetailsDataSchema,
  serviceDetailsDataSchema,
  type ApplicationDetail,
  type ApplicationSectionKey,
  type ApplicationSummary,
  type ServiceKey,
} from "@raahsathi/contracts/applications";
import {
  Prisma,
  type Application,
  type ApplicationEvent,
  type ApplicationSection,
  type Appointment,
  type IdentityAttempt,
  type PaymentAttempt,
  type PrismaClient,
} from "@prisma/client";

import type { AuthenticatedContext } from "@/server/auth/auth-types";
import { prisma } from "@/server/database/prisma";
import { retryTransientConnectionRead } from "@/server/database/read-retry";
import { apiErrors } from "@/server/http/api-error";
import { isLicenceMaintenanceService, serviceRequiresPermanentLicence } from "@/server/applications/service-profile";

type ApplicationSummaryRecord = Pick<Application, "id" | "serviceKey" | "status" | "updatedAt"> & {
  sections: Pick<ApplicationSection, "sectionKey" | "completedAt">[];
  identityAttempts: Pick<IdentityAttempt, "outcome">[];
  paymentAttempts: Pick<PaymentAttempt, "status">[];
  appointment: Pick<Appointment, "status"> | null;
};

type ApplicationRecord = Application & {
  sections: ApplicationSection[];
  events: ApplicationEvent[];
  identityAttempts: IdentityAttempt[];
  paymentAttempts: PaymentAttempt[];
  appointment: Appointment | null;
};

export function deriveApplicationPresentation(completedSectionKeys: readonly ApplicationSectionKey[], identityVerified = false, paymentSucceeded = false, appointmentBooked = false, serviceKey: ServiceKey = "LEARNER_LICENCE"): Readonly<{
  statusCode: "DRAFT" | "IN_PROGRESS" | "READY_FOR_IDENTITY" | "READY_FOR_PAYMENT" | "READY_FOR_APPOINTMENT" | "WAITLISTED" | "SLOT_OFFERED" | "APPOINTMENT_BOOKED" | "COMPLETED";
  progressPercent: number;
  nextActionCode: ApplicationSummary["nextActionCode"];
  blockingReasonCode?: "IDENTITY_VERIFICATION_REQUIRED" | "PAYMENT_REQUIRED";
}> {
  const completed = new Set(completedSectionKeys);
  const nextSection = applicationSectionOrder.find((sectionKey) => !completed.has(sectionKey));
  if (!nextSection && identityVerified && paymentSucceeded && isLicenceMaintenanceService(serviceKey)) return {
    statusCode: "COMPLETED", progressPercent: 100, nextActionCode: "REVIEW_COMPLETION",
  };
  if (!nextSection && identityVerified && paymentSucceeded && appointmentBooked) return {
    statusCode: "APPOINTMENT_BOOKED", progressPercent: 100, nextActionCode: "REVIEW_APPOINTMENT",
  };
  if (!nextSection && identityVerified && paymentSucceeded) return {
    statusCode: "READY_FOR_APPOINTMENT", progressPercent: 100, nextActionCode: "SELECT_APPOINTMENT",
  };
  if (!nextSection && identityVerified) return {
    statusCode: "READY_FOR_PAYMENT", progressPercent: 100, nextActionCode: "PAY_FEES", blockingReasonCode: "PAYMENT_REQUIRED",
  };
  return {
    statusCode: nextSection ? (completed.size === 0 ? "DRAFT" : "IN_PROGRESS") : "READY_FOR_IDENTITY",
    progressPercent: completed.size * 25,
    nextActionCode: nextSection ? `COMPLETE_${nextSection}` as ApplicationSummary["nextActionCode"] : "VERIFY_IDENTITY",
    ...(nextSection ? {} : { blockingReasonCode: "IDENTITY_VERIFICATION_REQUIRED" }),
  };
}

export function assertExpectedRevision(expected: number, current: number): void {
  if (expected !== current) throw apiErrors.conflict();
}

export function completionDecision(
  sectionKey: ApplicationSectionKey,
  savedSectionKeys: readonly ApplicationSectionKey[],
  completedSectionKeys: readonly ApplicationSectionKey[],
): "complete" | "already-complete" {
  if (!savedSectionKeys.includes(sectionKey)) throw apiErrors.invalidTransition();
  if (completedSectionKeys.includes(sectionKey)) return "already-complete";
  const index = applicationSectionOrder.indexOf(sectionKey);
  if (applicationSectionOrder.slice(0, index).some((key) => !completedSectionKeys.includes(key))) throw apiErrors.invalidTransition();
  return "complete";
}

function validateSectionData(sectionKey: ApplicationSectionKey, serviceKey: ServiceKey, data: unknown): Prisma.InputJsonValue {
  const schema = sectionKey === "PERSONAL_DETAILS" ? personalDetailsDataSchema
    : sectionKey === "ADDRESS" ? addressDataSchema
      : sectionKey === "SERVICE_DETAILS" ? serviceDetailsDataSchema
        : declarationDataSchema;
  const result = schema.safeParse(data);
  if (!result.success) throw apiErrors.validation(Object.fromEntries(result.error.issues.map((issue) => [`data.${issue.path.join(".") || "body"}`, [issue.code]])));
  if (sectionKey === "SERVICE_DETAILS") {
    const details = serviceDetailsDataSchema.parse(result.data);
    if (serviceKey === "PERMANENT_DRIVING_LICENCE" && !details.learnerLicenceReference) {
      throw apiErrors.validation({ "data.learnerLicenceReference": ["required"] });
    }
  }
  return result.data as Prisma.InputJsonValue;
}

function deriveSummary(record: ApplicationSummaryRecord): ApplicationSummary {
  if (record.status === "COMPLETED") return applicationSummarySchema.parse({
    id: record.id, serviceKey: record.serviceKey, statusCode: "COMPLETED", progressPercent: 100,
    nextActionCode: "REVIEW_COMPLETION", updatedAt: record.updatedAt.toISOString(),
  });
  if (record.status === "WAITLISTED") return applicationSummarySchema.parse({
    id: record.id, serviceKey: record.serviceKey, statusCode: "WAITLISTED", progressPercent: 100,
    nextActionCode: "REVIEW_WAITLIST", blockingReasonCode: "NO_SUITABLE_SLOT", updatedAt: record.updatedAt.toISOString(),
  });
  if (record.status === "SLOT_OFFERED") return applicationSummarySchema.parse({
    id: record.id, serviceKey: record.serviceKey, statusCode: "SLOT_OFFERED", progressPercent: 100,
    nextActionCode: "REVIEW_OFFER", blockingReasonCode: "WAITLIST_OFFER_PENDING", updatedAt: record.updatedAt.toISOString(),
  });
  const completed = new Set(record.sections.filter((section) => section.completedAt).map((section) => section.sectionKey));
  const presentation = deriveApplicationPresentation(
    [...completed],
    record.identityAttempts.some((attempt) => attempt.outcome === "VERIFIED"),
    record.paymentAttempts.some((attempt) => attempt.status === "SUCCEEDED"),
    record.appointment?.status === "CONFIRMED",
    record.serviceKey,
  );
  return applicationSummarySchema.parse({
    id: record.id,
    serviceKey: record.serviceKey,
    ...presentation,
    updatedAt: record.updatedAt.toISOString(),
  });
}

function derive(record: ApplicationRecord): ApplicationDetail {
  return applicationDetailSchema.parse({
    ...deriveSummary(record),
    targetLicenceId: record.targetLicenceId,
    sections: record.sections.map((section) => ({
      sectionKey: section.sectionKey,
      data: section.data,
      revision: section.revision,
      completed: section.completedAt !== null,
      updatedAt: section.updatedAt.toISOString(),
    })),
    history: record.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      ...(event.sectionKey ? { sectionKey: event.sectionKey } : {}),
      createdAt: event.createdAt.toISOString(),
    })),
  });
}

async function ownedRecord(database: Prisma.TransactionClient | PrismaClient, context: AuthenticatedContext, id: string): Promise<ApplicationRecord> {
  const application = await database.application.findFirst({
    where: { id, applicantId: context.applicantId }, include: { sections: { orderBy: { createdAt: "asc" } }, events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] }, identityAttempts: true, paymentAttempts: true, appointment: true },
  });
  if (!application) throw apiErrors.notFound();
  return application;
}

export async function createApplication(
  context: AuthenticatedContext,
  serviceKey: ServiceKey,
  correlationId: string,
  databaseClient: PrismaClient = prisma,
): Promise<ApplicationDetail> {
  try {
    return await databaseClient.$transaction(async (database) => {
    const existing = await database.application.findFirst({
      where: { applicantId: context.applicantId, serviceKey, NOT: { status: "COMPLETED" } },
      orderBy: { updatedAt: "desc" },
      include: { sections: { orderBy: { createdAt: "asc" } }, events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] }, identityAttempts: true, paymentAttempts: true, appointment: true },
    });
    if (existing) return derive(existing);
    const targetLicence = serviceRequiresPermanentLicence(serviceKey)
      ? await database.licenceRecord.findFirst({
          where: { applicantId: context.applicantId, kind: "PERMANENT" },
          orderBy: [{ validUntil: "desc" }, { id: "asc" }],
        })
      : null;
    if (serviceRequiresPermanentLicence(serviceKey) && !targetLicence) throw apiErrors.eligibleLicenceRequired();
    const created = await database.application.create({
      data: {
        applicantId: context.applicantId,
        serviceKey,
        targetLicenceId: targetLicence?.id,
        events: { create: { actorApplicantId: context.applicantId, eventType: "APPLICATION_CREATED", correlationId } },
      },
      include: { sections: true, events: true, identityAttempts: true, paymentAttempts: true, appointment: true },
    });
    return derive(created);
    }, { isolationLevel: "Serializable" });
  } catch (reason) {
    if (reason instanceof Prisma.PrismaClientKnownRequestError && reason.code === "P2002") {
      const existing = await databaseClient.application.findFirst({
        where: { applicantId: context.applicantId, serviceKey, NOT: { status: "COMPLETED" } },
        orderBy: { updatedAt: "desc" },
        include: { sections: true, events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] }, identityAttempts: true, paymentAttempts: true, appointment: true },
      });
      if (existing) return derive(existing);
    }
    throw reason;
  }
}

export async function listApplications(
  context: AuthenticatedContext,
  databaseClient: PrismaClient = prisma,
): Promise<readonly ApplicationSummary[]> {
  const records = await retryTransientConnectionRead(() => databaseClient.application.findMany({
    where: { applicantId: context.applicantId },
    select: {
      id: true,
      serviceKey: true,
      updatedAt: true,
      sections: { select: { sectionKey: true, completedAt: true } },
      status: true,
      identityAttempts: { select: { outcome: true } },
      paymentAttempts: { select: { status: true } },
      appointment: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
  }));
  return applicationListSchema.parse({ applications: records.map(deriveSummary) }).applications;
}

export async function getApplication(
  context: AuthenticatedContext,
  id: string,
  databaseClient: PrismaClient = prisma,
): Promise<ApplicationDetail> {
  return derive(await retryTransientConnectionRead(
    () => ownedRecord(databaseClient, context, id),
  ));
}

export async function saveApplicationSection(
  context: AuthenticatedContext,
  input: Readonly<{ applicationId: string; sectionKey: ApplicationSectionKey; expectedRevision: number; data: unknown; correlationId: string }>,
  databaseClient: PrismaClient = prisma,
): Promise<ApplicationDetail> {
  return databaseClient.$transaction(async (database) => {
    await database.$queryRaw(Prisma.sql`SELECT "id" FROM "Application" WHERE "id" = ${input.applicationId}::uuid AND "applicantId" = ${context.applicantId}::uuid FOR UPDATE`);
    const application = await ownedRecord(database, context, input.applicationId);
    const data = validateSectionData(input.sectionKey, application.serviceKey, input.data);
    if (application.serviceKey === "DRIVING_LICENCE_ADDRESS_CHANGE" && input.sectionKey === "ADDRESS") {
      if (!application.targetLicenceId) throw apiErrors.eligibleLicenceRequired();
      const licence = await database.licenceRecord.findFirst({
        where: { id: application.targetLicenceId, applicantId: context.applicantId, kind: "PERMANENT" },
      });
      if (!licence) throw apiErrors.eligibleLicenceRequired();
      const address = addressDataSchema.parse(input.data);
      if (licence.addressDistrict === address.district && licence.addressPostalCode === address.postalCode) {
        throw apiErrors.addressUnchanged();
      }
    }
    const current = application.sections.find((section) => section.sectionKey === input.sectionKey);
    if (current?.completedAt) throw apiErrors.invalidTransition();
    assertExpectedRevision(input.expectedRevision, current?.revision ?? 0);
    if (current) {
      await database.applicationSection.update({ where: { id: current.id }, data: { data, revision: { increment: 1 } } });
    } else {
      await database.applicationSection.create({ data: { applicationId: application.id, sectionKey: input.sectionKey, data } });
    }
    await database.application.update({ where: { id: application.id }, data: { status: "IN_PROGRESS" } });
    await database.applicationEvent.create({ data: {
      applicationId: application.id, actorApplicantId: context.applicantId, eventType: "SECTION_SAVED",
      sectionKey: input.sectionKey, correlationId: input.correlationId,
    } });
    return derive(await ownedRecord(database, context, application.id));
  }, { isolationLevel: "Serializable" });
}

export async function completeApplicationStep(
  context: AuthenticatedContext,
  input: Readonly<{ applicationId: string; sectionKey: ApplicationSectionKey; correlationId: string; now?: Date }>,
): Promise<ApplicationDetail> {
  return prisma.$transaction(async (database) => {
    await database.$queryRaw(Prisma.sql`SELECT "id" FROM "Application" WHERE "id" = ${input.applicationId}::uuid AND "applicantId" = ${context.applicantId}::uuid FOR UPDATE`);
    const application = await ownedRecord(database, context, input.applicationId);
    const section = application.sections.find((item) => item.sectionKey === input.sectionKey);
    const savedKeys = application.sections.map((item) => item.sectionKey);
    const completed = new Set(application.sections.filter((item) => item.completedAt).map((item) => item.sectionKey));
    if (completionDecision(input.sectionKey, savedKeys, [...completed]) === "already-complete") return derive(application);
    if (!section) throw apiErrors.invalidTransition();
    const index = applicationSectionOrder.indexOf(input.sectionKey);
    const now = input.now ?? new Date();
    await database.applicationSection.update({ where: { id: section.id }, data: { completedAt: now } });
    await database.applicationEvent.create({ data: {
      applicationId: application.id, actorApplicantId: context.applicantId, eventType: "SECTION_COMPLETED",
      sectionKey: input.sectionKey, correlationId: input.correlationId,
    } });
    const finalStep = index === applicationSectionOrder.length - 1;
    await database.application.update({ where: { id: application.id }, data: { status: finalStep ? "READY_FOR_IDENTITY" : "IN_PROGRESS" } });
    if (finalStep) await database.applicationEvent.create({ data: {
      applicationId: application.id, actorApplicantId: context.applicantId, eventType: "WORKFLOW_ADVANCED", correlationId: input.correlationId,
    } });
    return derive(await ownedRecord(database, context, application.id));
  }, { isolationLevel: "Serializable" });
}
