import { cookies } from "next/headers";

import type { DashboardSummary } from "@/features/dashboard/types";
import { listApplications } from "@/server/applications/application-service";
import { listAvailableServices } from "@/server/applications/service-catalogue";
import { resolveSessionFromCookie } from "@/server/auth/session-service";
import { listAppointments } from "@/server/appointments/appointment-service";
import { listLicences } from "@/server/licences/licence-service";
import { listWaitlistEntries } from "@/server/waitlist/waitlist-service";

const emptyDashboardSummary: DashboardSummary = {
  applications: [],
  appointments: [],
  offers: [],
  waitlistEntries: [],
  licences: [],
  services: [],
};

export async function getRealDashboardSummary(): Promise<DashboardSummary> {
  const session = await resolveSessionFromCookie((await cookies()).toString());
  if (session.kind !== "authenticated") return emptyDashboardSummary;

  const [applications, appointments, waitlistEntries, licences] = await Promise.all([
    listApplications(session.context),
    listAppointments(session.context),
    listWaitlistEntries(session.context),
    listLicences(session.context),
  ]);

  return {
    applications,
    appointments: appointments
      .filter(({ status }) => status === "CONFIRMED")
      .map((appointment) => ({
        id: appointment.id,
        applicationId: appointment.applicationId,
        rto: appointment.rto,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      })),
    offers: waitlistEntries.flatMap((entry) =>
      entry.offer?.status === "ACTIVE"
        ? [{ id: entry.offer.id, applicationId: entry.applicationId, rto: entry.rto, expiresAt: entry.offer.expiresAt }]
        : [],
    ),
    waitlistEntries: waitlistEntries
      .filter(({ status }) => status === "ACTIVE")
      .map((entry) => ({ id: entry.id, applicationId: entry.applicationId, rto: entry.rto, joinedAt: entry.joinedAt })),
    licences: licences.map(({ kind, vehicleClass }) => ({ kind, vehicleClass })),
    services: listAvailableServices(),
  };
}
