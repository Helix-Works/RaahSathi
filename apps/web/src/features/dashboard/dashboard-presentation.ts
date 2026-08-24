import type { DashboardApplicationSummary } from "@/features/dashboard/types";

type NextActionCopy = Readonly<{
  defaultDescription: string;
  readyForAppointmentDescription: string;
  appointmentBookedDescription: string;
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
