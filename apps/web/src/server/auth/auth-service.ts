import "server-only";

import type { OtpChallenge, SessionSummary, VerifyOtpInput } from "@raahsathi/contracts/auth";
import type { PreferredLocale } from "@prisma/client";

import { getServerEnvironment } from "@/server/config/environment";
import { prisma } from "@/server/database/prisma";
import { apiErrors } from "@/server/http/api-error";

import { authPolicy } from "./auth-policy";
import { writeAudit } from "./audit";
import { hashOtp, randomBase64Url, safeEqual } from "./crypto";
import { maskMobile, mobileLookupHash } from "./mobile";
import { issueSession } from "./session-service";

function databaseLocale(locale: "en" | "hi"): PreferredLocale {
  return locale === "hi" ? "HI" : "EN";
}

export async function requestOtp(
  mobileNumber: string,
  correlationId: string,
  now = new Date(),
): Promise<OtpChallenge> {
  const environment = getServerEnvironment();
  const lookupHash = mobileLookupHash(mobileNumber, environment.AUTH_MOBILE_LOOKUP_PEPPER);
  const otpSalt = randomBase64Url(authPolicy.otpSaltBytes);
  const otpHash = hashOtp(environment.AUTH_DEMO_OTP, otpSalt, environment.AUTH_OTP_PEPPER);
  const windowStart = new Date(now.getTime() - authPolicy.requestWindowMs);

  const result = await prisma.$transaction(async (database) => {
    await database.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lookupHash}))`;
    await database.authAttempt.updateMany({
      where: { mobileLookupHash: lookupHash, status: "PENDING", expiresAt: { lte: now } },
      data: { status: "EXPIRED" },
    });
    const latest = await database.authAttempt.findFirst({
      where: { mobileLookupHash: lookupHash },
      orderBy: { createdAt: "desc" },
    });
    const recentAttempts = await database.authAttempt.findMany({
      where: { mobileLookupHash: lookupHash, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    if ((latest && latest.resendAvailableAt > now) || recentAttempts.length >= authPolicy.requestsPerWindow) {
      const windowRetryAt = recentAttempts[0]
        ? new Date(recentAttempts[0].createdAt.getTime() + authPolicy.requestWindowMs)
        : new Date(now.getTime() + authPolicy.requestWindowMs);
      const retryAt = latest && latest.resendAvailableAt > now ? latest.resendAvailableAt : windowRetryAt;
      await writeAudit(database, {
        actorApplicantId: latest?.applicantId,
        eventType: "AUTH_RATE_LIMITED",
        resourceType: "AuthAttempt",
        resourceId: latest?.id,
        correlationId,
        metadata: { reasonCode: latest?.resendAvailableAt && latest.resendAvailableAt > now ? "COOLDOWN" : "WINDOW" },
      });
      return { kind: "rate-limited" as const, retryAfter: Math.max(1, Math.ceil((retryAt.getTime() - now.getTime()) / 1_000)) };
    }

    await database.authAttempt.updateMany({
      where: { mobileLookupHash: lookupHash, status: "PENDING" },
      data: { status: "SUPERSEDED" },
    });
    const applicant = await database.applicant.findUnique({ where: { mobileLookupHash: lookupHash } });
    const expiresAt = new Date(now.getTime() + authPolicy.otpLifetimeMs);
    const resendAvailableAt = new Date(now.getTime() + authPolicy.resendCooldownMs);
    const providerFailed = applicant?.authScenario === "PROVIDER_UNAVAILABLE";
    const attempt = await database.authAttempt.create({
      data: {
        applicantId: applicant?.id,
        mobileLookupHash: lookupHash,
        otpHash,
        otpSalt,
        status: providerFailed ? "PROVIDER_FAILED" : "PENDING",
        attemptsRemaining: authPolicy.otpAttempts,
        expiresAt,
        resendAvailableAt,
      },
    });
    await writeAudit(database, {
      actorApplicantId: applicant?.id,
      eventType: providerFailed ? "AUTH_OTP_PROVIDER_FAILED" : "AUTH_OTP_REQUESTED",
      resourceType: "AuthAttempt",
      resourceId: attempt.id,
      correlationId,
      metadata: providerFailed ? { reasonCode: "PROVIDER_UNAVAILABLE" } : undefined,
    });
    return { kind: providerFailed ? "provider-failed" as const : "issued" as const, attempt, expiresAt, resendAvailableAt };
  });

  if (result.kind === "rate-limited") throw apiErrors.authRateLimited(result.retryAfter);
  if (result.kind === "provider-failed") throw apiErrors.authProviderUnavailable();
  return {
    challengeId: result.attempt.id,
    maskedDestination: maskMobile(mobileNumber),
    expiresAt: result.expiresAt.toISOString(),
    resendAvailableAt: result.resendAvailableAt.toISOString(),
  };
}

export async function verifyOtp(
  input: VerifyOtpInput,
  previousSessionToken: string | undefined,
  correlationId: string,
  now = new Date(),
): Promise<Readonly<{ summary: SessionSummary; sessionToken: string; csrfToken: string; absoluteExpiresAt: Date }>> {
  const environment = getServerEnvironment();
  const result = await prisma.$transaction(async (database) => {
    await database.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${input.challengeId}))`;
    const attempt = await database.authAttempt.findUnique({ where: { id: input.challengeId }, include: { applicant: true } });
    if (!attempt || attempt.status === "VERIFIED" || attempt.status === "SUPERSEDED" || attempt.status === "PROVIDER_FAILED") {
      return { kind: "invalid" as const };
    }
    if (attempt.status === "LOCKED" || attempt.attemptsRemaining <= 0) return { kind: "exhausted" as const };
    if (attempt.status === "EXPIRED" || attempt.expiresAt <= now) {
      if (attempt.status === "PENDING") await database.authAttempt.update({ where: { id: attempt.id }, data: { status: "EXPIRED" } });
      return { kind: "expired" as const };
    }

    const validOtp = safeEqual(hashOtp(input.otp, attempt.otpSalt, environment.AUTH_OTP_PEPPER), attempt.otpHash);
    if (!validOtp || !attempt.applicant) {
      const attemptsRemaining = Math.max(0, attempt.attemptsRemaining - 1);
      await database.authAttempt.update({
        where: { id: attempt.id },
        data: { attemptsRemaining, status: attemptsRemaining === 0 ? "LOCKED" : "PENDING" },
      });
      await writeAudit(database, {
        actorApplicantId: attempt.applicantId,
        eventType: "AUTH_OTP_VERIFICATION_FAILED",
        resourceType: "AuthAttempt",
        resourceId: attempt.id,
        correlationId,
        metadata: { reasonCode: "INVALID", attemptsRemaining },
      });
      if (attemptsRemaining === 0) return { kind: "exhausted" as const };
      return { kind: "invalid" as const };
    }

    const applicant = await database.applicant.update({
      where: { id: attempt.applicant.id },
      data: { preferredLocale: databaseLocale(input.preferredLocale) },
    });
    await database.authAttempt.update({
      where: { id: attempt.id },
      data: { status: "VERIFIED", consumedAt: now },
    });
    await writeAudit(database, {
      actorApplicantId: applicant.id,
      eventType: "AUTH_OTP_VERIFIED",
      resourceType: "AuthAttempt",
      resourceId: attempt.id,
      correlationId,
    });
    const issued = await issueSession(database, {
      applicantId: applicant.id,
      previousToken: previousSessionToken,
      correlationId,
      now,
    });
    return { kind: "success" as const,
      summary: { user: { id: applicant.id, displayName: applicant.displayName, preferredLocale: input.preferredLocale } },
      ...issued,
    };
  });
  if (result.kind === "invalid") throw apiErrors.authOtpInvalid();
  if (result.kind === "expired") throw apiErrors.authOtpExpired();
  if (result.kind === "exhausted") throw apiErrors.authAttemptsExhausted();
  return result;
}
