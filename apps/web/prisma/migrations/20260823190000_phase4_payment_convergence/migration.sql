ALTER TYPE "ApplicationStatus" ADD VALUE 'READY_FOR_APPOINTMENT';

ALTER TYPE "ApplicationEventType" ADD VALUE 'PAYMENT_STARTED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'PAYMENT_FAILED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'PAYMENT_SUCCEEDED';

CREATE TYPE "PaymentProviderScenario" AS ENUM ('SUCCESS', 'DELAYED_SUCCESS', 'DUPLICATE_CALLBACK', 'FAILED', 'PROVIDER_UNAVAILABLE');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'PROVIDER_UNAVAILABLE');
CREATE TYPE "PaymentProviderOutcome" AS ENUM ('SUCCESS', 'FAILED');

ALTER TABLE "Application"
ADD COLUMN "paymentScenario" "PaymentProviderScenario" NOT NULL DEFAULT 'SUCCESS';

CREATE TABLE "FeeSnapshot" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "baseFeeMinor" INTEGER NOT NULL,
  "serviceChargeMinor" INTEGER NOT NULL,
  "totalAmountMinor" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeeSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FeeSnapshot_amounts_check" CHECK ("baseFeeMinor" >= 0 AND "serviceChargeMinor" >= 0 AND "totalAmountMinor" = "baseFeeMinor" + "serviceChargeMinor"),
  CONSTRAINT "FeeSnapshot_currency_check" CHECK ("currency" = 'INR')
);

CREATE TABLE "PaymentAttempt" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "feeSnapshotId" UUID NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "providerReference" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amountMinor" INTEGER NOT NULL,
  "succeededAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentAttempt_amount_check" CHECK ("amountMinor" > 0),
  CONSTRAINT "PaymentAttempt_attempt_number_check" CHECK ("attemptNumber" > 0)
);

CREATE TABLE "PaymentProviderEvent" (
  "id" UUID NOT NULL,
  "paymentAttemptId" UUID NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "outcome" "PaymentProviderOutcome" NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL,
  "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentProviderEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentProviderEvent_amount_check" CHECK ("amountMinor" > 0)
);

CREATE UNIQUE INDEX "FeeSnapshot_applicationId_key" ON "FeeSnapshot"("applicationId");
CREATE UNIQUE INDEX "FeeSnapshot_id_applicationId_key" ON "FeeSnapshot"("id", "applicationId");
CREATE UNIQUE INDEX "PaymentAttempt_idempotencyKey_key" ON "PaymentAttempt"("idempotencyKey");
CREATE UNIQUE INDEX "PaymentAttempt_providerReference_key" ON "PaymentAttempt"("providerReference");
CREATE UNIQUE INDEX "PaymentAttempt_applicationId_attemptNumber_key" ON "PaymentAttempt"("applicationId", "attemptNumber");
CREATE INDEX "PaymentAttempt_applicationId_createdAt_id_idx" ON "PaymentAttempt"("applicationId", "createdAt", "id");
CREATE UNIQUE INDEX "PaymentProviderEvent_providerEventId_key" ON "PaymentProviderEvent"("providerEventId");
CREATE INDEX "PaymentProviderEvent_paymentAttemptId_receivedAt_id_idx" ON "PaymentProviderEvent"("paymentAttemptId", "receivedAt", "id");

ALTER TABLE "FeeSnapshot" ADD CONSTRAINT "FeeSnapshot_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_feeSnapshotId_applicationId_fkey" FOREIGN KEY ("feeSnapshotId", "applicationId") REFERENCES "FeeSnapshot"("id", "applicationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentProviderEvent" ADD CONSTRAINT "PaymentProviderEvent_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
