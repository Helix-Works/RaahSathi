ALTER TABLE "LicenceRecord"
DROP CONSTRAINT "LicenceRecord_address_pair_check";

ALTER TABLE "LicenceRecord"
ADD CONSTRAINT "LicenceRecord_address_pair_check" CHECK (
  ("addressDistrict" IS NULL AND "addressPostalCode" IS NULL)
  OR (
    "addressDistrict" IS NOT NULL
    AND "addressPostalCode" IS NOT NULL
    AND "addressPostalCode" ~ '^11[0-9]{4}$'
  )
) NOT VALID;

ALTER TABLE "LicenceRecord"
VALIDATE CONSTRAINT "LicenceRecord_address_pair_check";
