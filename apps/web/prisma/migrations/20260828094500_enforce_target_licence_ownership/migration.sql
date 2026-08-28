ALTER TABLE "LicenceRecord"
ADD CONSTRAINT "LicenceRecord_id_applicantId_key" UNIQUE ("id", "applicantId");

ALTER TABLE "Application"
ADD CONSTRAINT "Application_targetLicenceId_applicantId_fkey"
FOREIGN KEY ("targetLicenceId", "applicantId")
REFERENCES "LicenceRecord"("id", "applicantId")
ON DELETE RESTRICT ON UPDATE CASCADE
NOT VALID;

ALTER TABLE "Application"
VALIDATE CONSTRAINT "Application_targetLicenceId_applicantId_fkey";
