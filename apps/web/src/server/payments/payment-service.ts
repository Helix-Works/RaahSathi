import "server-only";

import { createHmac, randomUUID } from "node:crypto";

import { addressDataSchema } from "@raahsathi/contracts/applications";
import {
  paymentContextSchema,
  type PaymentContext,
  type PaymentProviderEventRequest,
  type PaymentProviderOutcome,
  type PaymentStatus,
} from "@raahsathi/contracts/payments";
import {
  Prisma,
  type Application,
  type FeeSnapshot,
  type PaymentAttempt,
  type PaymentProviderScenario,
  type PrismaClient,
  type ServiceKey,
} from "@prisma/client";

import type { AuthenticatedContext } from "@/server/auth/auth-types";
import { isLicenceMaintenanceService } from "@/server/applications/service-profile";
import { safeEqual } from "@/server/auth/crypto";
import { getServerEnvironment } from "@/server/config/environment";
import { isRetryableTransactionConflict } from "@/server/database/prisma-errors";
import { prisma } from "@/server/database/prisma";
import { retryTransientConnectionRead } from "@/server/database/read-retry";
import { apiErrors } from "@/server/http/api-error";

type PaymentApplicationRecord = Application & {
  feeSnapshot: FeeSnapshot | null;
  paymentAttempts: PaymentAttempt[];
};

type FeeRule = Readonly<{
  baseFeeMinor: number;
  serviceChargeMinor: number;
  totalAmountMinor: number;
  currency: "INR";
}>;

export function feeForService(serviceKey: ServiceKey): FeeRule {
  const baseFeeMinor = serviceKey === "LEARNER_LICENCE" ? 50_000
    : serviceKey === "PERMANENT_DRIVING_LICENCE" ? 70_000
      : serviceKey === "DRIVING_LICENCE_RENEWAL" ? 40_000
        : 20_000;
  const serviceChargeMinor = 5_000;
  return { baseFeeMinor, serviceChargeMinor, totalAmountMinor: baseFeeMinor + serviceChargeMinor, currency: "INR" };
}

function addFiveSyntheticYears(value: Date): Date {
  const extended = new Date(value);
  extended.setUTCFullYear(extended.getUTCFullYear() + 5);
  return extended;
}

async function projectMaintenanceService(
  database: Prisma.TransactionClient,
  application: Application,
  occurredAt: Date,
  correlationId: string,
): Promise<void> {
  if (!isLicenceMaintenanceService(application.serviceKey) || !application.targetLicenceId) {
    throw new Error("Maintenance service completion invariant failed.");
  }
  await database.$queryRaw(Prisma.sql`SELECT "id" FROM "LicenceRecord" WHERE "id" = ${application.targetLicenceId}::uuid FOR UPDATE`);
  const licence = await database.licenceRecord.findFirst({
    where: { id: application.targetLicenceId, applicantId: application.applicantId, kind: "PERMANENT" },
  });
  if (!licence) throw new Error("Target licence completion invariant failed.");
  const addressSection = await database.applicationSection.findUnique({
    where: { applicationId_sectionKey: { applicationId: application.id, sectionKey: "ADDRESS" } },
  });
  if (!addressSection?.completedAt) throw new Error("Completed address section invariant failed.");
  const address = addressDataSchema.parse(addressSection.data);
  if (application.serviceKey === "DRIVING_LICENCE_RENEWAL") {
    const extensionBase = licence.validUntil > occurredAt ? licence.validUntil : occurredAt;
    await database.licenceRecord.update({
      where: { id: licence.id },
      data: {
        validUntil: addFiveSyntheticYears(extensionBase),
        renewedAt: occurredAt,
        addressDistrict: address.district,
        addressPostalCode: address.postalCode,
      },
    });
  } else {
    await database.licenceRecord.update({
      where: { id: licence.id },
      data: { addressDistrict: address.district, addressPostalCode: address.postalCode },
    });
  }
  await database.applicationEvent.create({ data: {
    applicationId: application.id,
    actorApplicantId: application.applicantId,
    eventType: "SERVICE_COMPLETED",
    correlationId,
    createdAt: occurredAt,
  } });
  await database.auditEvent.create({ data: {
    actorApplicantId: application.applicantId,
    eventType: "SERVICE_COMPLETED",
    resourceType: "Application",
    resourceId: application.id,
    correlationId,
    metadata: { serviceKey: application.serviceKey, targetLicenceId: licence.id },
    createdAt: occurredAt,
  } });
}

export function providerEventCanonicalValue(event: PaymentProviderEventRequest): string {
  return [event.eventId, event.providerReference, event.outcome, event.amountMinor, event.occurredAt].join("|");
}

export function signPaymentProviderEvent(event: PaymentProviderEventRequest, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(providerEventCanonicalValue(event), "utf8").digest("hex")}`;
}

export function verifyPaymentProviderSignature(event: PaymentProviderEventRequest, signature: string | null, secret: string): void {
  if (!signature || !safeEqual(signature, signPaymentProviderEvent(event, secret))) throw apiErrors.paymentEventInvalid();
}

function toPaymentContext(record: PaymentApplicationRecord, paymentId?: string): PaymentContext {
  const fee = record.feeSnapshot ?? { id: null, ...feeForService(record.serviceKey) };
  const attempt = paymentId
    ? record.paymentAttempts.find((candidate) => candidate.id === paymentId)
    : record.paymentAttempts.find((candidate) => candidate.status === "SUCCEEDED")
      ?? record.paymentAttempts[0];
  if (paymentId && !attempt) throw apiErrors.notFound();
  return paymentContextSchema.parse({
    applicationId: record.id,
    fee: {
      snapshotId: "id" in fee ? fee.id : null,
      baseFeeMinor: fee.baseFeeMinor,
      serviceChargeMinor: fee.serviceChargeMinor,
      totalAmountMinor: fee.totalAmountMinor,
      currency: fee.currency,
    },
    attempt: attempt ? {
      id: attempt.id,
      status: attempt.status,
      attemptNumber: attempt.attemptNumber,
      providerReference: attempt.providerReference,
      createdAt: attempt.createdAt.toISOString(),
      updatedAt: attempt.updatedAt.toISOString(),
      succeededAt: attempt.succeededAt?.toISOString() ?? null,
    } : null,
  });
}

async function ownedPaymentApplication(
  database: Prisma.TransactionClient | PrismaClient,
  context: AuthenticatedContext,
  applicationId: string,
): Promise<PaymentApplicationRecord> {
  const application = await database.application.findFirst({
    where: { id: applicationId, applicantId: context.applicantId },
    include: {
      feeSnapshot: true,
      paymentAttempts: { orderBy: [{ attemptNumber: "desc" }, { id: "desc" }] },
    },
  });
  if (!application) throw apiErrors.notFound();
  return application;
}

async function getPaymentContextForApplicationWithoutRetry(
  context: AuthenticatedContext,
  applicationId: string,
  database: PrismaClient = prisma,
): Promise<PaymentContext> {
  return toPaymentContext(await ownedPaymentApplication(database, context, applicationId));
}

export async function getPaymentContextForApplication(
  context: AuthenticatedContext,
  applicationId: string,
  database: PrismaClient = prisma,
): Promise<PaymentContext> {
  return retryTransientConnectionRead(
    () => getPaymentContextForApplicationWithoutRetry(context, applicationId, database),
  );
}

async function getPaymentWithoutRetry(
  context: AuthenticatedContext,
  paymentId: string,
  database: PrismaClient = prisma,
): Promise<PaymentContext> {
  const payment = await database.paymentAttempt.findFirst({
    where: { id: paymentId, application: { applicantId: context.applicantId } },
    select: { applicationId: true },
  });
  if (!payment) throw apiErrors.notFound();
  return toPaymentContext(
    await ownedPaymentApplication(database, context, payment.applicationId),
    paymentId,
  );
}

export async function getPayment(
  context: AuthenticatedContext,
  paymentId: string,
  database: PrismaClient = prisma,
): Promise<PaymentContext> {
  return retryTransientConnectionRead(
    () => getPaymentWithoutRetry(context, paymentId, database),
  );
}

export function paymentDecisionForScenario(scenario: PaymentProviderScenario, attemptNumber: number): Readonly<{
  scenario: PaymentProviderScenario;
  initialStatus: "PENDING" | "PROVIDER_UNAVAILABLE";
  immediateOutcome?: "SUCCESS" | "FAILED";
}> {
  const effectiveScenario = attemptNumber > 1 ? "SUCCESS" : scenario;
  return {
    scenario: effectiveScenario,
    initialStatus: effectiveScenario === "PROVIDER_UNAVAILABLE" ? "PROVIDER_UNAVAILABLE" : "PENDING",
    ...(effectiveScenario === "SUCCESS" || effectiveScenario === "DUPLICATE_CALLBACK"
      ? { immediateOutcome: "SUCCESS" as const }
      : effectiveScenario === "FAILED" ? { immediateOutcome: "FAILED" as const } : {}),
  };
}

export function paymentTransition(status: PaymentStatus, outcome: PaymentProviderOutcome): Readonly<{
  nextStatus: PaymentStatus;
  appendFailure: boolean;
  advanceApplication: boolean;
}> {
  if (outcome === "SUCCESS") return {
    nextStatus: "SUCCEEDED",
    appendFailure: false,
    advanceApplication: status !== "SUCCEEDED",
  };
  return {
    nextStatus: status === "PENDING" ? "FAILED" : status,
    appendFailure: status === "PENDING",
    advanceApplication: false,
  };
}

async function contextForProviderReference(database: PrismaClient, providerReference: string): Promise<PaymentContext> {
  const payment = await database.paymentAttempt.findUnique({ where: { providerReference } });
  if (!payment) throw apiErrors.notFound();
  const application = await database.application.findUnique({
    where: { id: payment.applicationId },
    include: { feeSnapshot: true, paymentAttempts: { orderBy: [{ attemptNumber: "desc" }, { id: "desc" }] } },
  });
  if (!application) throw apiErrors.notFound();
  return toPaymentContext(application, payment.id);
}

export async function applyPaymentProviderEvent(
  event: PaymentProviderEventRequest,
  correlationId: string,
  databaseClient: PrismaClient = prisma,
  retryOnSerializationConflict = true,
): Promise<PaymentContext> {
  try {
    return await databaseClient.$transaction(async (database) => {
      await database.$queryRaw(Prisma.sql`SELECT "id" FROM "PaymentAttempt" WHERE "providerReference" = ${event.providerReference} FOR UPDATE`);
      const payment = await database.paymentAttempt.findUnique({
        where: { providerReference: event.providerReference },
        include: { application: true, feeSnapshot: true },
      });
      if (!payment) throw apiErrors.notFound();
      if (payment.amountMinor !== event.amountMinor || payment.feeSnapshot.totalAmountMinor !== event.amountMinor) {
        throw apiErrors.paymentEventInvalid();
      }

      await database.paymentProviderEvent.create({ data: {
        paymentAttemptId: payment.id,
        providerEventId: event.eventId,
        outcome: event.outcome,
        amountMinor: event.amountMinor,
        occurredAt: new Date(event.occurredAt),
      } });

      const transition = paymentTransition(payment.status, event.outcome);

      if (transition.appendFailure) {
        await database.paymentAttempt.update({ where: { id: payment.id }, data: { status: "FAILED" } });
        await database.applicationEvent.create({ data: {
          applicationId: payment.applicationId,
          actorApplicantId: payment.application.applicantId,
          eventType: "PAYMENT_FAILED",
          correlationId,
        } });
      }

      if (transition.advanceApplication) {
        const occurredAt = new Date(event.occurredAt);
        await database.paymentAttempt.update({ where: { id: payment.id }, data: { status: "SUCCEEDED", succeededAt: occurredAt } });
        const maintenanceService = isLicenceMaintenanceService(payment.application.serviceKey);
        const advancement = await database.application.updateMany({
          where: { id: payment.applicationId, status: "READY_FOR_PAYMENT" },
          data: { status: maintenanceService ? "COMPLETED" : "READY_FOR_APPOINTMENT" },
        });
        if (advancement.count === 1) {
          await database.applicationEvent.create({ data: {
            applicationId: payment.applicationId,
            actorApplicantId: payment.application.applicantId,
            eventType: "PAYMENT_SUCCEEDED",
            correlationId,
            createdAt: occurredAt,
          } });
          if (maintenanceService) {
            await projectMaintenanceService(database, payment.application, occurredAt, correlationId);
          }
        }
      }

      return toPaymentContext(
        await database.application.findUniqueOrThrow({
          where: { id: payment.applicationId },
          include: { feeSnapshot: true, paymentAttempts: { orderBy: [{ attemptNumber: "desc" }, { id: "desc" }] } },
        }),
        payment.id,
      );
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await databaseClient.paymentProviderEvent.findUnique({
        where: { providerEventId: event.eventId },
        include: { paymentAttempt: true },
      });
      if (existing
        && existing.paymentAttempt.providerReference === event.providerReference
        && existing.outcome === event.outcome
        && existing.amountMinor === event.amountMinor
        && existing.occurredAt.getTime() === new Date(event.occurredAt).getTime()) {
        return contextForProviderReference(databaseClient, event.providerReference);
      }
      throw apiErrors.paymentEventInvalid();
    }
    if (isRetryableTransactionConflict(error) && retryOnSerializationConflict) {
      return applyPaymentProviderEvent(event, correlationId, databaseClient, false);
    }
    throw error;
  }
}

export async function processSignedPaymentProviderEvent(
  event: PaymentProviderEventRequest,
  signature: string | null,
  correlationId: string,
  options: Readonly<{ secret?: string; database?: PrismaClient }> = {},
): Promise<PaymentContext> {
  verifyPaymentProviderSignature(event, signature, options.secret ?? getServerEnvironment().PAYMENT_PROVIDER_WEBHOOK_SECRET);
  return applyPaymentProviderEvent(event, correlationId, options.database ?? prisma);
}

export async function startPayment(
  context: AuthenticatedContext,
  input: Readonly<{ applicationId: string; idempotencyKey: string; correlationId: string; now?: Date }>,
  databaseClient: PrismaClient = prisma,
): Promise<PaymentContext> {
  const now = input.now ?? new Date();
  let created: Readonly<{ context: PaymentContext; scenario?: PaymentProviderScenario }>;
  try {
    created = await databaseClient.$transaction(async (database) => {
      await database.$queryRaw(Prisma.sql`SELECT "id" FROM "Application" WHERE "id" = ${input.applicationId}::uuid AND "applicantId" = ${context.applicantId}::uuid FOR UPDATE`);
      const application = await database.application.findFirst({
        where: { id: input.applicationId, applicantId: context.applicantId },
        include: {
          identityAttempts: true,
          feeSnapshot: true,
          paymentAttempts: { orderBy: [{ attemptNumber: "desc" }, { id: "desc" }] },
        },
      });
      if (!application) throw apiErrors.notFound();
      if (!application.identityAttempts.some((attempt) => attempt.outcome === "VERIFIED")) throw apiErrors.invalidTransition();

      if (application.paymentAttempts.some((attempt) => attempt.status === "SUCCEEDED")) {
        return { context: toPaymentContext(application) };
      }
      const keyed = application.paymentAttempts.find((attempt) => attempt.idempotencyKey === input.idempotencyKey);
      if (keyed) return {
        context: toPaymentContext(application, keyed.id),
        ...(keyed.status === "PENDING" ? { scenario: paymentDecisionForScenario(application.paymentScenario, keyed.attemptNumber).scenario } : {}),
      };
      const pending = application.paymentAttempts.find((attempt) => attempt.status === "PENDING");
      if (pending) return {
        context: toPaymentContext(application, pending.id),
        scenario: paymentDecisionForScenario(application.paymentScenario, pending.attemptNumber).scenario,
      };

      const feeRule = feeForService(application.serviceKey);
      const feeSnapshot = application.feeSnapshot ?? await database.feeSnapshot.create({ data: {
        applicationId: application.id,
        ...feeRule,
      } });
      const attemptNumber = (application.paymentAttempts[0]?.attemptNumber ?? 0) + 1;
      const decision = paymentDecisionForScenario(application.paymentScenario, attemptNumber);
      const payment = await database.paymentAttempt.create({ data: {
        applicationId: application.id,
        feeSnapshotId: feeSnapshot.id,
        attemptNumber,
        idempotencyKey: input.idempotencyKey,
        providerReference: `SYN-PAY-${randomUUID().toUpperCase()}`,
        status: decision.initialStatus,
        amountMinor: feeSnapshot.totalAmountMinor,
        createdAt: now,
      } });
      await database.applicationEvent.create({ data: {
        applicationId: application.id,
        actorApplicantId: context.applicantId,
        eventType: "PAYMENT_STARTED",
        correlationId: input.correlationId,
        createdAt: now,
      } });
      const refreshed = await database.application.findUniqueOrThrow({
        where: { id: application.id },
        include: { feeSnapshot: true, paymentAttempts: { orderBy: [{ attemptNumber: "desc" }, { id: "desc" }] } },
      });
      return { context: toPaymentContext(refreshed, payment.id), scenario: decision.scenario };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
      const existing = await databaseClient.paymentAttempt.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) {
        if (existing.applicationId === input.applicationId) return getPaymentWithoutRetry(context, existing.id, databaseClient);
        throw apiErrors.validation({ idempotencyKey: ["already_used"] });
      }
      const persisted = await getPaymentContextForApplicationWithoutRetry(context, input.applicationId, databaseClient);
      if (persisted.attempt) return persisted;
    }
    throw error;
  }

  const attempt = created.context.attempt;
  const outcome = created.scenario ? paymentDecisionForScenario(created.scenario, 1).immediateOutcome : undefined;
  if (!attempt || !outcome) return created.context;
  const event: PaymentProviderEventRequest = {
    eventId: `evt_${attempt.id.replaceAll("-", "")}_${outcome.toLowerCase()}`,
    providerReference: attempt.providerReference,
    outcome,
    amountMinor: created.context.fee.totalAmountMinor,
    occurredAt: now.toISOString(),
  };
  const converged = await applyPaymentProviderEvent(event, input.correlationId, databaseClient);
  if (created.scenario === "DUPLICATE_CALLBACK") await applyPaymentProviderEvent(event, input.correlationId, databaseClient);
  return converged;
}
