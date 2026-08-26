import "server-only";

import { Prisma } from "@prisma/client";

import { apiErrors } from "@/server/http/api-error";

const expiryBatchSize = 50;
const expirableOfferInclude = { waitlistEntry: true } as const;

export type ExpirableOffer = Prisma.SlotOfferGetPayload<{ include: typeof expirableOfferInclude }>;

export type OfferExpiryScope =
  | Readonly<{ kind: "slot"; slotId: string }>
  | Readonly<{ kind: "entry"; entryId: string; applicantId?: string }>
  | Readonly<{ kind: "applicant"; applicantId: string; applicationId?: string }>;

function scopeWhere(scope: OfferExpiryScope): Prisma.SlotOfferWhereInput {
  if (scope.kind === "slot") return { slotId: scope.slotId };
  if (scope.kind === "entry") {
    return {
      waitlistEntryId: scope.entryId,
      ...(scope.applicantId ? { waitlistEntry: { applicantId: scope.applicantId } } : {}),
    };
  }
  return {
    waitlistEntry: {
      applicantId: scope.applicantId,
      ...(scope.applicationId ? { applicationId: scope.applicationId } : {}),
    },
  };
}

export async function expireOfferInTransaction(
  database: Prisma.TransactionClient,
  offer: ExpirableOffer,
  now: Date,
  correlationId: string,
): Promise<boolean> {
  const changed = await database.slotOffer.updateMany({
    where: { id: offer.id, status: "ACTIVE", expiresAt: { lte: now } },
    data: { status: "EXPIRED", expiredAt: now },
  });
  if (changed.count !== 1) return false;

  const released = await database.appointmentSlot.updateMany({
    where: { id: offer.slotId, heldCount: { gt: 0 } },
    data: { heldCount: { decrement: 1 } },
  });
  if (released.count !== 1) throw apiErrors.offerStateConflict();

  await database.waitlistEntry.updateMany({
    where: { id: offer.waitlistEntryId, status: "OFFERED" },
    data: { status: "ACTIVE" },
  });
  await database.application.updateMany({
    where: { id: offer.waitlistEntry.applicationId, status: "SLOT_OFFERED" },
    data: { status: "WAITLISTED" },
  });
  await database.applicationEvent.create({ data: {
    applicationId: offer.waitlistEntry.applicationId,
    actorApplicantId: offer.waitlistEntry.applicantId,
    eventType: "SLOT_OFFER_EXPIRED",
    correlationId,
    createdAt: now,
  } });
  await database.auditEvent.create({ data: {
    actorApplicantId: offer.waitlistEntry.applicantId,
    eventType: "SLOT_OFFER_EXPIRED",
    resourceType: "SlotOffer",
    resourceId: offer.id,
    correlationId,
    metadata: { slotId: offer.slotId },
    createdAt: now,
  } });
  return true;
}

export async function expireOffersInTransaction(
  database: Prisma.TransactionClient,
  input: Readonly<{ now: Date; correlationId: string; scope: OfferExpiryScope }>,
): Promise<readonly string[]> {
  const expired = await database.slotOffer.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: input.now }, ...scopeWhere(input.scope) },
    include: expirableOfferInclude,
    orderBy: [{ expiresAt: "asc" }, { id: "asc" }],
    take: expiryBatchSize,
  });
  const releasedSlots = new Set<string>();
  for (const offer of expired) {
    if (await expireOfferInTransaction(database, offer, input.now, input.correlationId)) {
      releasedSlots.add(offer.slotId);
    }
  }
  return [...releasedSlots];
}
