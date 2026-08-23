ALTER TYPE "ApplicationStatus" ADD VALUE 'READY_FOR_PAYMENT';
ALTER TYPE "ApplicationEventType" ADD VALUE 'IDENTITY_STARTED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'IDENTITY_RETRY_STARTED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'IDENTITY_VERIFIED';

CREATE TYPE "IdentityProviderScenario" AS ENUM ('SUCCESS', 'OTP_INVALID', 'USER_MISMATCH', 'TIMEOUT', 'PROVIDER_UNAVAILABLE', 'RETRY_REQUIRED');
CREATE TYPE "IdentityOutcome" AS ENUM ('VERIFIED', 'OTP_INVALID', 'USER_MISMATCH', 'TIMEOUT', 'PROVIDER_UNAVAILABLE', 'RETRY_REQUIRED');
CREATE TYPE "DocumentKind" AS ENUM ('SYNTHETIC_IDENTITY_PROOF', 'SYNTHETIC_ADDRESS_PROOF');
CREATE TYPE "LicenceKind" AS ENUM ('LEARNER');
CREATE TYPE "VehicleClass" AS ENUM ('LMV');

ALTER TABLE "Application" ADD COLUMN "identityScenario" "IdentityProviderScenario" NOT NULL DEFAULT 'SUCCESS';

CREATE TABLE "DocumentRecord" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "kind" "DocumentKind" NOT NULL,
  "syntheticReference" TEXT NOT NULL,
  "issuedAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdentityAttempt" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "outcome" "IdentityOutcome" NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "retryOfId" UUID,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IdentityAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IdentityAttempt_attemptNumber_check" CHECK ("attemptNumber" >= 1)
);

CREATE TABLE "LicenceRecord" (
  "id" UUID NOT NULL,
  "applicantId" UUID NOT NULL,
  "kind" "LicenceKind" NOT NULL,
  "syntheticReference" TEXT NOT NULL,
  "vehicleClass" "VehicleClass" NOT NULL,
  "issuedAt" TIMESTAMPTZ(3) NOT NULL,
  "validUntil" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LicenceRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LicenceRecord_validity_check" CHECK ("validUntil" > "issuedAt")
);

CREATE UNIQUE INDEX "DocumentRecord_applicationId_kind_key" ON "DocumentRecord"("applicationId", "kind");
CREATE INDEX "DocumentRecord_applicationId_createdAt_idx" ON "DocumentRecord"("applicationId", "createdAt");
CREATE UNIQUE INDEX "IdentityAttempt_retryOfId_key" ON "IdentityAttempt"("retryOfId");
CREATE UNIQUE INDEX "IdentityAttempt_applicationId_attemptNumber_key" ON "IdentityAttempt"("applicationId", "attemptNumber");
CREATE INDEX "IdentityAttempt_applicationId_createdAt_id_idx" ON "IdentityAttempt"("applicationId", "createdAt", "id");
CREATE UNIQUE INDEX "LicenceRecord_syntheticReference_key" ON "LicenceRecord"("syntheticReference");
CREATE UNIQUE INDEX "LicenceRecord_applicantId_kind_key" ON "LicenceRecord"("applicantId", "kind");
CREATE INDEX "LicenceRecord_applicantId_validUntil_idx" ON "LicenceRecord"("applicantId", "validUntil");

ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdentityAttempt" ADD CONSTRAINT "IdentityAttempt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdentityAttempt" ADD CONSTRAINT "IdentityAttempt_retryOfId_fkey" FOREIGN KEY ("retryOfId") REFERENCES "IdentityAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LicenceRecord" ADD CONSTRAINT "LicenceRecord_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
