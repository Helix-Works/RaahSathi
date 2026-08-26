import type { ServiceKey } from "@raahsathi/contracts/applications";
import {
  appointmentListSchema,
  appointmentSchema,
  createAppointmentRequestSchema,
  daySlotsSchema,
  monthAvailabilitySchema,
  rtoListSchema,
} from "@raahsathi/contracts/appointments";

import { apiRequest, createInvalidResponseError } from "@/lib/api";

export async function listRtos(signal?: AbortSignal) {
  const parsed = rtoListSchema.safeParse(
    await apiRequest("/rtos", { cache: "no-store", signal }),
  );
  if (!parsed.success) throw createInvalidResponseError(200);
  return parsed.data.rtos;
}

export async function getRtoMonthAvailability(
  rtoId: string,
  month: string,
  service: ServiceKey,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ month, service });
  const parsed = monthAvailabilitySchema.safeParse(
    await apiRequest(`/rtos/${rtoId}/availability?${query}`, {
      cache: "no-store",
      signal,
    }),
  );
  if (!parsed.success) throw createInvalidResponseError(200);
  return parsed.data;
}

export async function getRtoDaySlots(
  rtoId: string,
  date: string,
  service: ServiceKey,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ date, service });
  const parsed = daySlotsSchema.safeParse(
    await apiRequest(`/rtos/${rtoId}/slots?${query}`, {
      cache: "no-store",
      signal,
    }),
  );
  if (!parsed.success) throw createInvalidResponseError(200);
  return parsed.data;
}

export async function bookAppointment(applicationId: string, slotId: string) {
  const request = createAppointmentRequestSchema.parse({ applicationId, slotId });
  const parsed = appointmentSchema.safeParse(
    await apiRequest("/appointments", { method: "POST", json: request }),
  );
  if (!parsed.success) throw createInvalidResponseError(201);
  return parsed.data;
}

export async function listAppointments(signal?: AbortSignal) {
  const parsed = appointmentListSchema.safeParse(
    await apiRequest("/appointments", { cache: "no-store", signal }),
  );
  if (!parsed.success) throw createInvalidResponseError(200);
  return parsed.data.appointments;
}
