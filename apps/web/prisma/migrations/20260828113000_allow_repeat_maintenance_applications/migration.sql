DROP INDEX "Application_applicantId_serviceKey_key";

CREATE UNIQUE INDEX "Application_core_service_unique"
ON "Application" ("applicantId", "serviceKey")
WHERE "serviceKey" IN ('LEARNER_LICENCE', 'PERMANENT_DRIVING_LICENCE');

CREATE UNIQUE INDEX "Application_active_maintenance_unique"
ON "Application" ("applicantId", "serviceKey", "targetLicenceId")
WHERE "serviceKey" IN ('DRIVING_LICENCE_RENEWAL', 'DRIVING_LICENCE_ADDRESS_CHANGE')
  AND "status" <> 'COMPLETED';
