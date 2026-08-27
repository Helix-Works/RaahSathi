import type { DashboardApplicationSummary } from "@/features/dashboard/types";

type NextActionCopy = Readonly<{
  defaultDescription: string;
  readyForAppointmentDescription: string;
  appointmentBookedDescription: string;
  waitlistedDescription: string;
  slotOfferedDescription: string;
  noActionDescription: string;
  continueLabel: string;
}>;

export type NextActionCardPresentation = Readonly<{
  description: string;
  actionLabel?: string;
  actionHref?: string;
}>;

export function resolveNextActionCard(
  application: Pick<DashboardApplicationSummary, "id" | "statusCode" | "nextActionCode">,
  copy: NextActionCopy,
): NextActionCardPresentation {
  if (application.statusCode === "SLOT_OFFERED") {
    return { description: copy.slotOfferedDescription, actionLabel: copy.continueLabel, actionHref: `/applications/${application.id}` };
  }
  if (application.statusCode === "WAITLISTED") {
    return { description: copy.waitlistedDescription, actionLabel: copy.continueLabel, actionHref: `/applications/${application.id}` };
  }
  if (application.nextActionCode === "SELECT_APPOINTMENT") {
    return {
      description: copy.readyForAppointmentDescription,
      actionLabel: copy.continueLabel,
      actionHref: `/applications/${application.id}`,
    };
  }

  if (application.nextActionCode !== "NONE") {
    return {
      description: copy.defaultDescription,
      actionLabel: copy.continueLabel,
      actionHref: `/applications/${application.id}`,
    };
  }

  const description = application.statusCode === "READY_FOR_APPOINTMENT"
    ? copy.readyForAppointmentDescription
    : application.statusCode === "APPOINTMENT_BOOKED"
      ? copy.appointmentBookedDescription
      : copy.noActionDescription;

  return { description };
}
