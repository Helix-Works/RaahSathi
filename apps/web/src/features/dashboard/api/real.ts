import { cookies } from "next/headers";

import type { DashboardSummary } from "@/features/dashboard/types";
import { selectHeroApplication } from "@/features/dashboard/dashboard-presentation";
import { listApplications } from "@/server/applications/application-service";
import { resolveSessionFromCookie } from "@/server/auth/session-service";
import { listAppointments } from "@/server/appointments/appointment-service";
import { listLicences } from "@/server/licences/licence-service";
import { listWaitlistEntries } from "@/server/waitlist/waitlist-service";

export async function getRealDashboardSummary(): Promise<DashboardSummary> {
  const session = await resolveSessionFromCookie((await cookies()).toString());
  if (session.kind !== "authenticated") return {};
  const [applications, appointments, waitlistEntries, licences] = await Promise.all([
    listApplications(session.context),
    listAppointments(session.context),
    listWaitlistEntries(session.context),
    listLicences(session.context),
  ]);
  const application = selectHeroApplication(applications);
  if (!application) return {};
  const licence = licences.find(({ kind }) => kind === "LEARNER");
  const licenceSummary = licence ? { kind: licence.kind, vehicleClass: licence.vehicleClass } : undefined;
  const appointment = appointments.find(
    (item) => item.applicationId === application.id && item.status === "CONFIRMED",
  );
  if (appointment) {
    return { application, appointment: { id: appointment.id, rto: appointment.rto, date: appointment.date, startTime: appointment.startTime, endTime: appointment.endTime }, ...(licenceSummary ? { licence: licenceSummary } : {}) };
  }
  const waitlist = waitlistEntries.find((entry) => entry.applicationId === application.id && (entry.status === "ACTIVE" || entry.status === "OFFERED"));
  if (!waitlist) return { application, ...(licenceSummary ? { licence: licenceSummary } : {}) };
  const activeOffer = waitlist.offer?.status === "ACTIVE" ? waitlist.offer : undefined;
  return {
    application,
    ...(activeOffer
      ? { offer: { id: activeOffer.id, rto: waitlist.rto, expiresAt: activeOffer.expiresAt } }
      : { waitlist: { id: waitlist.id, rto: waitlist.rto, joinedAt: waitlist.joinedAt } }),
    ...(licenceSummary ? { licence: licenceSummary } : {}),
  };
}
