import "server-only";

import type { Prisma } from "@prisma/client";

export type AuditEventType =
  | "AUTH_OTP_REQUESTED"
  | "AUTH_OTP_PROVIDER_FAILED"
  | "AUTH_OTP_VERIFICATION_FAILED"
  | "AUTH_OTP_VERIFIED"
  | "AUTH_RATE_LIMITED"
  | "SESSION_CREATED"
  | "SESSION_ROTATED"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED"
  | "CSRF_REJECTED";

type AuditMetadata = Readonly<{
  reasonCode?: string;
  attemptsRemaining?: number;
  sessionLifecycleReason?: string;
}>;

export async function writeAudit(
  database: Prisma.TransactionClient,
  input: Readonly<{
    actorApplicantId?: string | null;
    eventType: AuditEventType;
    resourceType: "AuthAttempt" | "Session";
    resourceId?: string | null;
    correlationId: string;
    metadata?: AuditMetadata;
  }>,
): Promise<void> {
  const metadata = input.metadata
    ? Object.fromEntries(
        (["reasonCode", "attemptsRemaining", "sessionLifecycleReason"] as const)
          .flatMap((key) => input.metadata?.[key] === undefined ? [] : [[key, input.metadata[key]]]),
      )
    : undefined;
  await database.auditEvent.create({
    data: {
      actorApplicantId: input.actorApplicantId,
      eventType: input.eventType,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      correlationId: input.correlationId,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
