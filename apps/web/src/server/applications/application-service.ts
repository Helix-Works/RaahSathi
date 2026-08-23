import "server-only";

import {
  addressDataSchema,
  applicationDetailSchema,
  applicationListSchema,
  declarationDataSchema,
  personalDetailsDataSchema,
  serviceDetailsDataSchema,
  type ApplicationDetail,
  type ApplicationSectionKey,
  type ApplicationSummary,
  type ServiceKey,
} from "@raahsathi/contracts/applications";
import { Prisma, type Application, type ApplicationEvent, type ApplicationSection } from "@prisma/client";

import type { AuthenticatedContext } from "@/server/auth/auth-types";
import { prisma } from "@/server/database/prisma";
import { apiErrors } from "@/server/http/api-error";

export const applicationSectionOrder: readonly ApplicationSectionKey[] = [
  "PERSONAL_DETAILS", "ADDRESS", "SERVICE_DETAILS", "DECLARATION",
];

type ApplicationRecord = Application & { sections: ApplicationSection[]; events: ApplicationEvent[] };

export function deriveApplicationPresentation(completedSectionKeys: readonly ApplicationSectionKey[]): Readonly<{
  statusCode: "DRAFT" | "IN_PROGRESS" | "READY_FOR_IDENTITY";
  progressPercent: number;
  nextActionCode: ApplicationSummary["nextActionCode"];
  blockingReasonCode?: "IDENTITY_VERIFICATION_REQUIRED";
}> {
  const completed = new Set(completedSectionKeys);
  const nextSection = applicationSectionOrder.find((sectionKey) => !completed.has(sectionKey));
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

function derive(record: ApplicationRecord): ApplicationDetail {
  const completed = new Set(record.sections.filter((section) => section.completedAt).map((section) => section.sectionKey));
  const presentation = deriveApplicationPresentation([...completed]);
  return applicationDetailSchema.parse({
    id: record.id,
    serviceKey: record.serviceKey,
    ...presentation,
    updatedAt: record.updatedAt.toISOString(),
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

async function ownedRecord(database: Prisma.TransactionClient | typeof prisma, context: AuthenticatedContext, id: string): Promise<ApplicationRecord> {
  const application = await database.application.findFirst({
    where: { id, applicantId: context.applicantId }, include: { sections: { orderBy: { createdAt: "asc" } }, events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
  if (!application) throw apiErrors.notFound();
  return application;
}

export async function createApplication(context: AuthenticatedContext, serviceKey: ServiceKey, correlationId: string): Promise<ApplicationDetail> {
  try {
    return await prisma.$transaction(async (database) => {
    const existing = await database.application.findUnique({
      where: { applicantId_serviceKey: { applicantId: context.applicantId, serviceKey } },
      include: { sections: { orderBy: { createdAt: "asc" } }, events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
    });
    if (existing) return derive(existing);
    const created = await database.application.create({
      data: {
        applicantId: context.applicantId,
        serviceKey,
        events: { create: { actorApplicantId: context.applicantId, eventType: "APPLICATION_CREATED", correlationId } },
      },
      include: { sections: true, events: true },
    });
    return derive(created);
    }, { isolationLevel: "Serializable" });
  } catch (reason) {
    if (reason instanceof Prisma.PrismaClientKnownRequestError && reason.code === "P2002") {
      const existing = await prisma.application.findUnique({
        where: { applicantId_serviceKey: { applicantId: context.applicantId, serviceKey } },
        include: { sections: true, events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
      });
      if (existing) return derive(existing);
    }
    throw reason;
  }
}

export async function listApplications(context: AuthenticatedContext): Promise<readonly ApplicationSummary[]> {
  const records = await prisma.application.findMany({
    where: { applicantId: context.applicantId },
    include: { sections: true, events: true }, orderBy: { updatedAt: "desc" },
  });
  return applicationListSchema.parse({ applications: records.map(derive) }).applications;
}

export async function getApplication(context: AuthenticatedContext, id: string): Promise<ApplicationDetail> {
  return derive(await ownedRecord(prisma, context, id));
}

export async function saveApplicationSection(
  context: AuthenticatedContext,
  input: Readonly<{ applicationId: string; sectionKey: ApplicationSectionKey; expectedRevision: number; data: unknown; correlationId: string }>,
): Promise<ApplicationDetail> {
  return prisma.$transaction(async (database) => {
    await database.$queryRaw(Prisma.sql`SELECT "id" FROM "Application" WHERE "id" = ${input.applicationId}::uuid AND "applicantId" = ${context.applicantId}::uuid FOR UPDATE`);
    const application = await ownedRecord(database, context, input.applicationId);
    const data = validateSectionData(input.sectionKey, application.serviceKey, input.data);
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
