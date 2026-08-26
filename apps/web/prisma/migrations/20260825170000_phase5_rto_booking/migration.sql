ALTER TYPE "ApplicationStatus" ADD VALUE 'APPOINTMENT_BOOKED';

ALTER TYPE "ApplicationEventType" ADD VALUE 'APPOINTMENT_BOOKED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'APPOINTMENT_CANCELLED';

CREATE TYPE "RtoOperationalStatus" AS ENUM ('AVAILABLE', 'CENTER_UNAVAILABLE');
CREATE TYPE "BookingServiceStatus" AS ENUM ('AVAILABLE', 'BOOKING_SERVICE_UNAVAILABLE');
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED');
CREATE TYPE "AppointmentRateLimitAction" AS ENUM ('BOOK', 'CANCEL');

CREATE TABLE "Rto" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "nameHi" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "operationalStatus" "RtoOperationalStatus" NOT NULL DEFAULT 'AVAILABLE',
  "bookingServiceStatus" "BookingServiceStatus" NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Rto_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Rto_code_check" CHECK ("code" ~ '^SYNTHETIC_[A-Z_]{3,40}$')
);

CREATE TABLE "AppointmentSlot" (
  "id" UUID NOT NULL,
  "rtoId" UUID NOT NULL,
  "serviceKey" "ServiceKey" NOT NULL,
  "date" DATE NOT NULL,
  "startTime" CHAR(5) NOT NULL,
  "endTime" CHAR(5) NOT NULL,
  "capacity" INTEGER NOT NULL,
  "bookedCount" INTEGER NOT NULL DEFAULT 0,
  "releasedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentSlot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppointmentSlot_capacity_check" CHECK ("capacity" > 0 AND "bookedCount" >= 0 AND "bookedCount" <= "capacity"),
  CONSTRAINT "AppointmentSlot_time_check" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "startTime" < "endTime")
);

CREATE TABLE "Appointment" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "applicantId" UUID NOT NULL,
  "slotId" UUID NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
  "bookedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_status_dates_check" CHECK (("status" = 'CONFIRMED' AND "cancelledAt" IS NULL) OR ("status" = 'CANCELLED' AND "cancelledAt" IS NOT NULL))
);

CREATE TABLE "AppointmentRateLimitBucket" (
  "id" UUID NOT NULL,
  "applicantId" UUID NOT NULL,
  "action" "AppointmentRateLimitAction" NOT NULL,
  "bucketStart" TIMESTAMPTZ(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentRateLimitBucket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppointmentRateLimitBucket_count_check" CHECK ("count" > 0)
);

CREATE UNIQUE INDEX "Rto_code_key" ON "Rto"("code");
CREATE INDEX "Rto_operationalStatus_bookingServiceStatus_idx" ON "Rto"("operationalStatus", "bookingServiceStatus");
CREATE UNIQUE INDEX "AppointmentSlot_rtoId_serviceKey_date_startTime_key" ON "AppointmentSlot"("rtoId", "serviceKey", "date", "startTime");
CREATE INDEX "AppointmentSlot_rtoId_serviceKey_date_releasedAt_idx" ON "AppointmentSlot"("rtoId", "serviceKey", "date", "releasedAt");
CREATE UNIQUE INDEX "Appointment_applicationId_key" ON "Appointment"("applicationId");
CREATE INDEX "Appointment_applicantId_status_bookedAt_idx" ON "Appointment"("applicantId", "status", "bookedAt");
CREATE INDEX "Appointment_slotId_status_idx" ON "Appointment"("slotId", "status");
CREATE UNIQUE INDEX "AppointmentRateLimitBucket_applicantId_action_bucketStart_key" ON "AppointmentRateLimitBucket"("applicantId", "action", "bucketStart");
CREATE INDEX "AppointmentRateLimitBucket_bucketStart_idx" ON "AppointmentRateLimitBucket"("bucketStart");

ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_rtoId_fkey" FOREIGN KEY ("rtoId") REFERENCES "Rto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AppointmentSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppointmentRateLimitBucket" ADD CONSTRAINT "AppointmentRateLimitBucket_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
