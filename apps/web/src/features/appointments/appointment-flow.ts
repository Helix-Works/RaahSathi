import type { Appointment } from "@raahsathi/contracts/appointments";

export type AppointmentSelection = Readonly<{
  rtoId?: string;
  month: string;
  date?: string;
  slotId?: string;
}>;

export function selectRto(selection: AppointmentSelection, rtoId: string): AppointmentSelection {
  return { month: selection.month, rtoId };
}

export function selectMonth(selection: AppointmentSelection, month: string): AppointmentSelection {
  return { month, rtoId: selection.rtoId };
}

export function selectDate(selection: AppointmentSelection, date: string): AppointmentSelection {
  return { month: selection.month, rtoId: selection.rtoId, date };
}

export function selectSlot(selection: AppointmentSelection, slotId: string): AppointmentSelection {
  return { ...selection, slotId };
}

export function confirmedAppointmentForApplication(
  appointments: readonly Appointment[],
  applicationId: string,
): Appointment | undefined {
  return appointments.find(
    (appointment) => appointment.applicationId === applicationId && appointment.status === "CONFIRMED",
  );
}

export function beginAppointmentOperation(lock: { current: boolean }): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

export function isActiveAppointmentRequest(
  current: AbortController | undefined,
  request: AbortController,
): boolean {
  return current === request && !request.signal.aborted;
}

export function isBookedReconstructionLoading(
  statusCode: string,
  loading: string | undefined,
): boolean {
  return statusCode === "APPOINTMENT_BOOKED" && loading === "reconstruct";
}
