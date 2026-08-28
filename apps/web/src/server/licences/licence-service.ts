import "server-only";

import { licenceListSchema, licenceRecordSchema, type LicenceRecordSummary } from "@raahsathi/contracts/identity";
import type { PrismaClient } from "@prisma/client";

import type { AuthenticatedContext } from "@/server/auth/auth-types";
import { prisma } from "@/server/database/prisma";
import { retryTransientConnectionRead } from "@/server/database/read-retry";
import { apiErrors } from "@/server/http/api-error";

function toSummary(record: Readonly<{
  id: string;
  kind: "LEARNER" | "PERMANENT";
  syntheticReference: string;
  vehicleClass: "LMV";
  issuedAt: Date;
  validUntil: Date;
  addressDistrict: string | null;
  addressPostalCode: string | null;
  renewedAt: Date | null;
}>): LicenceRecordSummary {
  return licenceRecordSchema.parse({
    id: record.id,
    kind: record.kind,
    syntheticReference: record.syntheticReference,
    vehicleClass: record.vehicleClass,
    issuedAt: record.issuedAt.toISOString(),
    validUntil: record.validUntil.toISOString(),
    address: record.addressDistrict && record.addressPostalCode
      ? { district: record.addressDistrict, postalCode: record.addressPostalCode }
      : null,
    renewedAt: record.renewedAt?.toISOString() ?? null,
  });
}

export async function listLicences(context: AuthenticatedContext, database: PrismaClient = prisma): Promise<readonly LicenceRecordSummary[]> {
  const records = await retryTransientConnectionRead(() => database.licenceRecord.findMany({
    where: { applicantId: context.applicantId },
    orderBy: [{ validUntil: "desc" }, { id: "asc" }],
  }));
  return licenceListSchema.parse({ licences: records.map(toSummary) }).licences;
}

export async function getLicence(context: AuthenticatedContext, id: string, database: PrismaClient = prisma): Promise<LicenceRecordSummary> {
  const record = await retryTransientConnectionRead(
    () => database.licenceRecord.findFirst({ where: { id, applicantId: context.applicantId } }),
  );
  if (!record) throw apiErrors.notFound();
  return toSummary(record);
}
