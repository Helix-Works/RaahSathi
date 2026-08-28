ALTER TYPE "ServiceKey" ADD VALUE 'DRIVING_LICENCE_RENEWAL';
ALTER TYPE "ServiceKey" ADD VALUE 'DRIVING_LICENCE_ADDRESS_CHANGE';

ALTER TYPE "ApplicationStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'SERVICE_COMPLETED';
ALTER TYPE "LicenceKind" ADD VALUE 'PERMANENT';

ALTER TABLE "Application" ADD COLUMN "targetLicenceId" UUID;

ALTER TABLE "LicenceRecord"
ADD COLUMN "addressDistrict" TEXT,
ADD COLUMN "addressPostalCode" CHAR(6),
ADD COLUMN "renewedAt" TIMESTAMPTZ(3),
ADD CONSTRAINT "LicenceRecord_address_pair_check" CHECK (
  ("addressDistrict" IS NULL AND "addressPostalCode" IS NULL)
  OR ("addressDistrict" IS NOT NULL AND "addressPostalCode" ~ '^11[0-9]{4}$')
);

CREATE INDEX "Application_targetLicenceId_idx" ON "Application"("targetLicenceId");

ALTER TABLE "Application"
ADD CONSTRAINT "Application_targetLicenceId_fkey"
FOREIGN KEY ("targetLicenceId") REFERENCES "LicenceRecord"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
