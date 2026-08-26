ALTER TYPE "ApplicationStatus" ADD VALUE 'WAITLISTED';
ALTER TYPE "ApplicationStatus" ADD VALUE 'SLOT_OFFERED';

ALTER TYPE "ApplicationEventType" ADD VALUE 'WAITLIST_JOINED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'WAITLIST_UPDATED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'WAITLIST_LEFT';
ALTER TYPE "ApplicationEventType" ADD VALUE 'SLOT_OFFER_CREATED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'SLOT_OFFER_ACCEPTED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'SLOT_OFFER_DECLINED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'SLOT_OFFER_EXPIRED';

CREATE TYPE "WaitlistStatus" AS ENUM ('ACTIVE', 'OFFERED', 'LEFT', 'FULFILLED');
CREATE TYPE "WaitlistTimeBucket" AS ENUM ('MORNING', 'AFTERNOON');
CREATE TYPE "SlotOfferStatus" AS ENUM ('ACTIVE', 'ACCEPTED', 'DECLINED', 'EXPIRED');
CREATE TYPE "WaitlistRateLimitAction" AS ENUM ('JOIN', 'UPDATE', 'LEAVE', 'ACCEPT_OFFER', 'DECLINE_OFFER');

ALTER TABLE "AppointmentSlot" ADD COLUMN "heldCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AppointmentSlot" ADD COLUMN "vehicleClass" "VehicleClass" NOT NULL DEFAULT 'LMV';
ALTER TABLE "AppointmentSlot" DROP CONSTRAINT "AppointmentSlot_capacity_check";
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_capacity_check"
  CHECK ("capacity" > 0 AND "bookedCount" >= 0 AND "heldCount" >= 0 AND "bookedCount" + "heldCount" <= "capacity");

CREATE TABLE "WaitlistEntry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "applicationId" UUID NOT NULL,
  "applicantId" UUID NOT NULL,
  "rtoId" UUID NOT NULL,
  "serviceKey" "ServiceKey" NOT NULL,
  "vehicleClass" "VehicleClass" NOT NULL DEFAULT 'LMV',
  "acceptableDateFrom" DATE NOT NULL,
  "acceptableDateTo" DATE NOT NULL,
  "timeBuckets" "WaitlistTimeBucket"[] NOT NULL,
  "status" "WaitlistStatus" NOT NULL DEFAULT 'ACTIVE',
  "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WaitlistEntry_date_range_check" CHECK ("acceptableDateFrom" <= "acceptableDateTo"),
  CONSTRAINT "WaitlistEntry_time_buckets_check" CHECK (cardinality("timeBuckets") > 0),
  CONSTRAINT "WaitlistEntry_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WaitlistEntry_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WaitlistEntry_rtoId_fkey" FOREIGN KEY ("rtoId") REFERENCES "Rto"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WaitlistEntry_active_application_key" ON "WaitlistEntry"("applicationId") WHERE "status" IN ('ACTIVE', 'OFFERED');
CREATE INDEX "WaitlistEntry_applicantId_joinedAt_id_idx" ON "WaitlistEntry"("applicantId", "joinedAt", "id");
CREATE INDEX "WaitlistEntry_match_idx" ON "WaitlistEntry"("rtoId", "serviceKey", "vehicleClass", "status", "joinedAt", "id");
CREATE INDEX "WaitlistEntry_dates_idx" ON "WaitlistEntry"("acceptableDateFrom", "acceptableDateTo");

CREATE TABLE "SlotOffer" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "waitlistEntryId" UUID NOT NULL,
  "slotId" UUID NOT NULL,
  "status" "SlotOfferStatus" NOT NULL DEFAULT 'ACTIVE',
  "offeredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "acceptedAt" TIMESTAMPTZ(3),
  "declinedAt" TIMESTAMPTZ(3),
  "expiredAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "SlotOffer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SlotOffer_expiry_check" CHECK ("expiresAt" > "offeredAt"),
  CONSTRAINT "SlotOffer_waitlistEntryId_fkey" FOREIGN KEY ("waitlistEntryId") REFERENCES "WaitlistEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SlotOffer_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AppointmentSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SlotOffer_waitlistEntryId_slotId_key" ON "SlotOffer"("waitlistEntryId", "slotId");
CREATE UNIQUE INDEX "SlotOffer_active_entry_key" ON "SlotOffer"("waitlistEntryId") WHERE "status" = 'ACTIVE';
CREATE INDEX "SlotOffer_slotId_status_expiresAt_idx" ON "SlotOffer"("slotId", "status", "expiresAt");
CREATE INDEX "SlotOffer_waitlistEntryId_status_expiresAt_idx" ON "SlotOffer"("waitlistEntryId", "status", "expiresAt");

CREATE TABLE "WaitlistRateLimitBucket" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "applicantId" UUID NOT NULL,
  "action" "WaitlistRateLimitAction" NOT NULL,
  "bucketStart" TIMESTAMPTZ(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "WaitlistRateLimitBucket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WaitlistRateLimitBucket_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WaitlistRateLimitBucket_applicantId_action_bucketStart_key" ON "WaitlistRateLimitBucket"("applicantId", "action", "bucketStart");
CREATE INDEX "WaitlistRateLimitBucket_bucketStart_idx" ON "WaitlistRateLimitBucket"("bucketStart");
