-- CreateEnum
CREATE TYPE "PreferredLocale" AS ENUM ('EN', 'HI');

-- CreateEnum
CREATE TYPE "AuthAttemptStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'LOCKED');

-- CreateTable
CREATE TABLE "Applicant" (
    "id" UUID NOT NULL,
    "mobileLookupHash" TEXT NOT NULL,
    "mobileLast4" CHAR(4) NOT NULL,
    "preferredLocale" "PreferredLocale" NOT NULL DEFAULT 'EN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAttempt" (
    "id" UUID NOT NULL,
    "applicantId" UUID,
    "mobileLookupHash" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "otpSalt" TEXT NOT NULL,
    "status" "AuthAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "attemptsRemaining" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "resendAvailableAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuthAttempt_attemptsRemaining_check" CHECK ("attemptsRemaining" >= 0),
    CONSTRAINT "AuthAttempt_expiresAt_check" CHECK ("expiresAt" > "createdAt"),
    CONSTRAINT "AuthAttempt_resendAvailableAt_check" CHECK ("resendAvailableAt" >= "createdAt")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "applicantId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfSecretHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idleExpiresAt" TIMESTAMPTZ(3) NOT NULL,
    "absoluteExpiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Session_idleExpiresAt_check" CHECK ("idleExpiresAt" > "createdAt"),
    CONSTRAINT "Session_absoluteExpiresAt_check" CHECK ("absoluteExpiresAt" > "createdAt"),
    CONSTRAINT "Session_expiry_order_check" CHECK ("idleExpiresAt" <= "absoluteExpiresAt")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "actorApplicantId" UUID,
    "eventType" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_mobileLookupHash_key" ON "Applicant"("mobileLookupHash");

-- CreateIndex
CREATE INDEX "AuthAttempt_mobileLookupHash_createdAt_idx" ON "AuthAttempt"("mobileLookupHash", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAttempt_expiresAt_idx" ON "AuthAttempt"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_applicantId_revokedAt_idx" ON "Session"("applicantId", "revokedAt");

-- CreateIndex
CREATE INDEX "Session_idleExpiresAt_idx" ON "Session"("idleExpiresAt");

-- CreateIndex
CREATE INDEX "Session_absoluteExpiresAt_idx" ON "Session"("absoluteExpiresAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorApplicantId_createdAt_idx" ON "AuditEvent"("actorApplicantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceType_resourceId_createdAt_idx" ON "AuditEvent"("resourceType", "resourceId", "createdAt");

-- AddForeignKey
ALTER TABLE "AuthAttempt" ADD CONSTRAINT "AuthAttempt_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorApplicantId_fkey" FOREIGN KEY ("actorApplicantId") REFERENCES "Applicant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
