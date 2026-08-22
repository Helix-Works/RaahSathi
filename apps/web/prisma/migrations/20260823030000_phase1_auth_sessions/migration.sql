-- AlterEnum
ALTER TYPE "AuthAttemptStatus" ADD VALUE 'SUPERSEDED';
ALTER TYPE "AuthAttemptStatus" ADD VALUE 'PROVIDER_FAILED';

-- CreateEnum
CREATE TYPE "SyntheticAuthScenario" AS ENUM ('STANDARD', 'PROVIDER_UNAVAILABLE');

-- AlterTable
ALTER TABLE "Applicant"
ADD COLUMN "displayName" TEXT NOT NULL DEFAULT 'RaahSathi Demo',
ADD COLUMN "authScenario" "SyntheticAuthScenario" NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "Applicant" ALTER COLUMN "displayName" DROP DEFAULT;

ALTER TABLE "AuthAttempt"
ADD COLUMN "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AuthAttempt" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "AuthAttempt_mobileLookupHash_createdAt_status_idx"
ON "AuthAttempt"("mobileLookupHash", "createdAt", "status");
