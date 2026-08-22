import "server-only";

import type { PreferredLocale, Prisma } from "@prisma/client";

import { prisma } from "@/server/database/prisma";

import { authPolicy } from "./auth-policy";
import type { IssuedSession, ResolvedSession } from "./auth-types";
import { writeAudit } from "./audit";
import { csrfCookieName, readCookie, sessionCookieName } from "./cookies";
import { randomBase64Url, sha256 } from "./crypto";

function publicLocale(locale: PreferredLocale): "en" | "hi" {
  return locale === "HI" ? "hi" : "en";
}

export async function issueSession(
  database: Prisma.TransactionClient,
  input: Readonly<{
    applicantId: string;
    previousToken?: string;
    correlationId: string;
    now: Date;
  }>,
): Promise<IssuedSession> {
  if (input.previousToken) {
    const previous = await database.session.findUnique({ where: { tokenHash: sha256(input.previousToken) } });
    if (previous && previous.revokedAt === null) {
      await database.session.update({ where: { id: previous.id }, data: { revokedAt: input.now } });
      await writeAudit(database, {
        actorApplicantId: previous.applicantId,
        eventType: "SESSION_ROTATED",
        resourceType: "Session",
        resourceId: previous.id,
        correlationId: input.correlationId,
        metadata: { sessionLifecycleReason: "LOGIN_ROTATION" },
      });
    }
  }

  const sessionToken = randomBase64Url(authPolicy.sessionTokenBytes);
  const csrfToken = randomBase64Url(authPolicy.csrfTokenBytes);
  const idleExpiresAt = new Date(input.now.getTime() + authPolicy.sessionIdleMs);
  const absoluteExpiresAt = new Date(input.now.getTime() + authPolicy.sessionAbsoluteMs);
  const session = await database.session.create({
    data: {
      applicantId: input.applicantId,
      tokenHash: sha256(sessionToken),
      csrfSecretHash: sha256(csrfToken),
      idleExpiresAt,
      absoluteExpiresAt,
    },
  });
  await writeAudit(database, {
    actorApplicantId: input.applicantId,
    eventType: "SESSION_CREATED",
    resourceType: "Session",
    resourceId: session.id,
    correlationId: input.correlationId,
  });
  return { sessionToken, csrfToken, absoluteExpiresAt };
}

export async function resolveSessionFromCookie(
  cookieHeader: string | null,
  options: Readonly<{ now?: Date; touch?: boolean; correlationId?: string }> = {},
): Promise<ResolvedSession> {
  const rawToken = readCookie(cookieHeader, sessionCookieName);
  if (!rawToken) return { kind: "anonymous" };

  const now = options.now ?? new Date();
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(rawToken) },
    include: { applicant: true },
  });
  if (!session) return { kind: "anonymous" };
  if (session.revokedAt) return { kind: "expired" };

  if (session.idleExpiresAt <= now || session.absoluteExpiresAt <= now) {
    await prisma.$transaction(async (database) => {
      const updated = await database.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: now } });
      if (updated.count > 0) await writeAudit(database, {
        actorApplicantId: session.applicantId,
        eventType: "SESSION_EXPIRED",
        resourceType: "Session",
        resourceId: session.id,
        correlationId: options.correlationId ?? "session-expiry",
        metadata: { sessionLifecycleReason: session.absoluteExpiresAt <= now ? "ABSOLUTE" : "IDLE" },
      });
    });
    return { kind: "expired" };
  }

  if (options.touch !== false && now.getTime() - session.lastSeenAt.getTime() >= authPolicy.sessionTouchIntervalMs) {
    const candidate = new Date(now.getTime() + authPolicy.sessionIdleMs);
    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: now, idleExpiresAt: candidate < session.absoluteExpiresAt ? candidate : session.absoluteExpiresAt },
    });
  }

  return {
    kind: "authenticated",
    context: { sessionId: session.id, applicantId: session.applicantId },
    user: {
      id: session.applicant.id,
      displayName: session.applicant.displayName,
      preferredLocale: publicLocale(session.applicant.preferredLocale),
    },
    csrfSecretHash: session.csrfSecretHash,
  };
}

export async function revokeSession(
  sessionId: string,
  applicantId: string,
  correlationId: string,
  now = new Date(),
): Promise<void> {
  await prisma.$transaction(async (database) => {
    const updated = await database.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: now } });
    if (updated.count > 0) await writeAudit(database, {
      actorApplicantId: applicantId,
      eventType: "SESSION_REVOKED",
      resourceType: "Session",
      resourceId: sessionId,
      correlationId,
      metadata: { sessionLifecycleReason: "LOGOUT" },
    });
  });
}

export function sessionTokensFromRequest(request: Request): Readonly<{
  sessionToken?: string;
  csrfToken?: string;
}> {
  const cookies = request.headers.get("cookie");
  return {
    sessionToken: readCookie(cookies, sessionCookieName),
    csrfToken: readCookie(cookies, csrfCookieName),
  };
}
