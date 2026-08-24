import "server-only";

import { applicationSectionOrder } from "@raahsathi/contracts/applications";
import {
  identityContextSchema,
  type IdentityContext,
  type IdentityOutcome,
} from "@raahsathi/contracts/identity";
import {
  Prisma,
  type Application,
  type DocumentRecord,
  type IdentityAttempt,
  type IdentityProviderScenario,
  type PrismaClient,
} from "@prisma/client";

import type { AuthenticatedContext } from "@/server/auth/auth-types";
import { isRetryableTransactionConflict } from "@/server/database/prisma-errors";
import { prisma } from "@/server/database/prisma";
import { apiErrors } from "@/server/http/api-error";

type IdentityRecord = Application & {
  documents: DocumentRecord[];
  identityAttempts: IdentityAttempt[];
};

export function providerOutcomeForAttempt(
  scenario: IdentityProviderScenario,
  attemptNumber: number,
): IdentityOutcome {
  if (attemptNumber > 1 && scenario !== "USER_MISMATCH") return "VERIFIED";
  return scenario === "SUCCESS" ? "VERIFIED" : scenario;
}

export function isRetryableIdentityOutcome(outcome: IdentityOutcome): boolean {
  return ["OTP_INVALID", "TIMEOUT", "PROVIDER_UNAVAILABLE", "RETRY_REQUIRED"].includes(outcome);
}

export function isIdentityConcurrencyConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;

  return error.code === "P2002" || isRetryableTransactionConflict(error);
}

function toContext(record: IdentityRecord): IdentityContext {
  const attempt = record.identityAttempts[0];
  return identityContextSchema.parse({
    attempt: attempt ? {
      id: attempt.id,
      outcome: attempt.outcome,
      attemptNumber: attempt.attemptNumber,
      retryable: isRetryableIdentityOutcome(attempt.outcome),
      createdAt: attempt.createdAt.toISOString(),
    } : null,
    documents: record.documents.map((document) => ({
      id: document.id,
      kind: document.kind,
      syntheticReference: document.syntheticReference,
      issuedAt: document.issuedAt.toISOString(),
    })),
  });
}

async function ownedIdentityRecord(
  database: Prisma.TransactionClient | PrismaClient,
  context: AuthenticatedContext,
  applicationId: string,
): Promise<IdentityRecord> {
  const application = await database.application.findFirst({
    where: { id: applicationId, applicantId: context.applicantId },
    include: {
      documents: { orderBy: [{ kind: "asc" }, { id: "asc" }] },
      identityAttempts: { orderBy: [{ attemptNumber: "desc" }, { id: "desc" }] },
    },
  });
  if (!application) throw apiErrors.notFound();
  return application;
}

export async function getIdentityContext(
  context: AuthenticatedContext,
  applicationId: string,
  database: PrismaClient = prisma,
): Promise<IdentityContext> {
  return toContext(await ownedIdentityRecord(database, context, applicationId));
}

function syntheticDocumentReference(applicationId: string, suffix: "ID" | "ADDRESS"): string {
  return `SYN-${suffix}-${applicationId.slice(0, 8).toUpperCase()}`;
}

async function advanceVerifiedIdentity(
  database: Prisma.TransactionClient,
  input: Readonly<{ applicationId: string; applicantId: string; correlationId: string }>,
): Promise<void> {
  await database.application.update({ where: { id: input.applicationId }, data: { status: "READY_FOR_PAYMENT" } });
  await database.applicationEvent.create({ data: {
    applicationId: input.applicationId,
    actorApplicantId: input.applicantId,
    eventType: "IDENTITY_VERIFIED",
    correlationId: input.correlationId,
  } });
}

export async function startIdentityAttempt(
  context: AuthenticatedContext,
  input: Readonly<{ applicationId: string; correlationId: string; now?: Date }>,
  databaseClient: PrismaClient = prisma,
): Promise<IdentityContext> {
  try {
    return await databaseClient.$transaction(async (database) => {
      await database.$queryRaw(Prisma.sql`SELECT "id" FROM "Application" WHERE "id" = ${input.applicationId}::uuid AND "applicantId" = ${context.applicantId}::uuid FOR UPDATE`);
      const application = await database.application.findFirst({
        where: { id: input.applicationId, applicantId: context.applicantId },
        include: { sections: true, identityAttempts: { orderBy: [{ attemptNumber: "desc" }, { id: "desc" }] } },
      });
      if (!application) throw apiErrors.notFound();
      if (application.identityAttempts[0]) return toContext(await ownedIdentityRecord(database, context, application.id));

      const completed = new Set(application.sections.filter((section) => section.completedAt).map((section) => section.sectionKey));
      if (applicationSectionOrder.some((sectionKey) => !completed.has(sectionKey))) throw apiErrors.invalidTransition();

      const now = input.now ?? new Date();
      await database.documentRecord.createMany({
        data: [
          { applicationId: application.id, kind: "SYNTHETIC_IDENTITY_PROOF", syntheticReference: syntheticDocumentReference(application.id, "ID"), issuedAt: now },
          { applicationId: application.id, kind: "SYNTHETIC_ADDRESS_PROOF", syntheticReference: syntheticDocumentReference(application.id, "ADDRESS"), issuedAt: now },
        ],
        skipDuplicates: true,
      });
      const outcome = providerOutcomeForAttempt(application.identityScenario, 1);
      await database.identityAttempt.create({ data: {
        applicationId: application.id,
        outcome,
        attemptNumber: 1,
        correlationId: input.correlationId,
        createdAt: now,
      } });
      await database.applicationEvent.create({ data: {
        applicationId: application.id,
        actorApplicantId: context.applicantId,
        eventType: "IDENTITY_STARTED",
        correlationId: input.correlationId,
        createdAt: now,
      } });
      if (outcome === "VERIFIED") await advanceVerifiedIdentity(database, {
        applicationId: application.id, applicantId: context.applicantId, correlationId: input.correlationId,
      });
      return toContext(await ownedIdentityRecord(database, context, application.id));
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (!isIdentityConcurrencyConflict(error)) throw error;
    const persisted = await ownedIdentityRecord(databaseClient, context, input.applicationId);
    if (!persisted.identityAttempts[0]) throw error;
    return toContext(persisted);
  }
}

export async function retryIdentityAttempt(
  context: AuthenticatedContext,
  input: Readonly<{ applicationId: string; attemptId: string; correlationId: string; now?: Date }>,
  databaseClient: PrismaClient = prisma,
): Promise<IdentityContext> {
  try {
    return await databaseClient.$transaction(async (database) => {
    await database.$queryRaw(Prisma.sql`SELECT "id" FROM "Application" WHERE "id" = ${input.applicationId}::uuid AND "applicantId" = ${context.applicantId}::uuid FOR UPDATE`);
    const application = await database.application.findFirst({
      where: { id: input.applicationId, applicantId: context.applicantId },
      include: { identityAttempts: { orderBy: [{ attemptNumber: "desc" }, { id: "desc" }] } },
    });
    if (!application) throw apiErrors.notFound();
    const latest = application.identityAttempts[0];
    if (!latest) throw apiErrors.invalidTransition();
    if (latest.outcome === "VERIFIED" && (latest.id === input.attemptId || latest.retryOfId === input.attemptId)) {
      return toContext(await ownedIdentityRecord(database, context, application.id));
    }
    if (latest.retryOfId === input.attemptId) {
      return toContext(await ownedIdentityRecord(database, context, application.id));
    }
    if (latest.id !== input.attemptId || !isRetryableIdentityOutcome(latest.outcome)) throw apiErrors.invalidTransition();

    const now = input.now ?? new Date();
    const attemptNumber = latest.attemptNumber + 1;
    const outcome = providerOutcomeForAttempt(application.identityScenario, attemptNumber);
    await database.identityAttempt.create({ data: {
      applicationId: application.id,
      outcome,
      attemptNumber,
      retryOfId: latest.id,
      correlationId: input.correlationId,
      createdAt: now,
    } });
    await database.applicationEvent.create({ data: {
      applicationId: application.id,
      actorApplicantId: context.applicantId,
      eventType: "IDENTITY_RETRY_STARTED",
      correlationId: input.correlationId,
      createdAt: now,
    } });
    if (outcome === "VERIFIED") await advanceVerifiedIdentity(database, {
      applicationId: application.id, applicantId: context.applicantId, correlationId: input.correlationId,
    });
    return toContext(await ownedIdentityRecord(database, context, application.id));
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (!isIdentityConcurrencyConflict(error)) throw error;
    const persisted = await ownedIdentityRecord(databaseClient, context, input.applicationId);
    const latest = persisted.identityAttempts[0];
    if (!latest || (latest.id !== input.attemptId && latest.retryOfId !== input.attemptId)) throw error;
    return toContext(persisted);
  }
}
