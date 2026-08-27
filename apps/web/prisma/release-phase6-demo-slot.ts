import { PrismaClient } from "@prisma/client";

const database = new PrismaClient();
const seedLockKey = "raahsathi:seed:phase6-demo";
const applicationId = "30000000-0000-4000-8000-000000000005";
const applicantId = "10000000-0000-4000-8000-000000000006";
const slotId = "51000000-0000-4000-8000-000000000004";
const appointmentId = "52000000-0000-4000-8000-000000000001";

async function main(): Promise<void> {
  const released = await database.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${seedLockKey}))::text`;
    await transaction.$queryRaw`SELECT "id" FROM "Application" WHERE "id" = ${applicationId}::uuid FOR UPDATE`;
    await transaction.$queryRaw`SELECT "id" FROM "AppointmentSlot" WHERE "id" = ${slotId}::uuid FOR UPDATE`;
    const appointment = await transaction.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment || appointment.applicationId !== applicationId || appointment.applicantId !== applicantId
      || appointment.slotId !== slotId) {
      throw new Error("The Phase 6 capacity-holder fixture is missing or incompatible.");
    }
    if (appointment.status === "CANCELLED") return false;
    const slotChanged = await transaction.appointmentSlot.updateMany({
      where: { id: slotId, bookedCount: { gt: 0 } },
      data: { bookedCount: { decrement: 1 } },
    });
    if (slotChanged.count !== 1) throw new Error("The Phase 6 full-slot capacity invariant is inconsistent.");
    const now = new Date();
    await transaction.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED", cancelledAt: now },
    });
    await transaction.application.update({ where: { id: applicationId }, data: { status: "READY_FOR_APPOINTMENT" } });
    await transaction.applicationEvent.create({ data: {
      id: "32000000-0000-4000-8000-000000000075",
      applicationId,
      actorApplicantId: applicantId,
      eventType: "APPOINTMENT_CANCELLED",
      correlationId: "synthetic-phase6-release",
      createdAt: now,
    } });
    await transaction.auditEvent.create({ data: {
      id: "44000000-0000-4000-8000-000000000001",
      actorApplicantId: applicantId,
      eventType: "APPOINTMENT_CANCELLED",
      resourceType: "Appointment",
      resourceId: appointmentId,
      correlationId: "synthetic-phase6-release",
      metadata: { applicationId, slotId, fixtureAction: "RELEASE_WAITLIST_CAPACITY" },
      createdAt: now,
    } });
    return true;
  }, { maxWait: 15_000, timeout: 30_000 });
  console.info(released
    ? "Released the Phase 6 synthetic waitlist slot. Call POST /api/v1/waitlist/process as the waitlist applicant."
    : "The Phase 6 synthetic waitlist slot was already released; no state changed.");
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.name : "Phase6DemoReleaseError");
    process.exitCode = 1;
  })
  .finally(async () => database.$disconnect());
