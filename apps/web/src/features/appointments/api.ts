import { appointmentSchema, daySlotsSchema, monthAvailabilitySchema, rtoListSchema } from "@raahsathi/contracts/appointments";
import { joinWaitlistRequestSchema, waitlistEntrySchema, waitlistListSchema } from "@raahsathi/contracts/waitlist";
import { apiRequest, createInvalidResponseError } from "@/lib/api";

export async function getRtos() {
  const parsed = rtoListSchema.safeParse(await apiRequest("/rtos", { cache: "no-store" }));
  if (!parsed.success) throw createInvalidResponseError(200); return parsed.data.rtos;
}
export async function getAvailability(rtoId: string, month: string, service: string) {
  const parsed = monthAvailabilitySchema.safeParse(await apiRequest(`/rtos/${rtoId}/availability?month=${month}&service=${service}`, { cache: "no-store" }));
  if (!parsed.success) throw createInvalidResponseError(200); return parsed.data;
}
export async function getSlots(rtoId: string, date: string, service: string) {
  const parsed = daySlotsSchema.safeParse(await apiRequest(`/rtos/${rtoId}/slots?date=${date}&service=${service}`, { cache: "no-store" }));
  if (!parsed.success) throw createInvalidResponseError(200); return parsed.data;
}
export async function bookSlot(applicationId: string, slotId: string) {
  const parsed = appointmentSchema.safeParse(await apiRequest("/appointments", { method: "POST", json: { applicationId, slotId } }));
  if (!parsed.success) throw createInvalidResponseError(201); return parsed.data;
}
export async function joinWaitlist(input: unknown) {
  const request = joinWaitlistRequestSchema.parse(input);
  const parsed = waitlistEntrySchema.safeParse(await apiRequest("/waitlist", { method: "POST", json: request }));
  if (!parsed.success) throw createInvalidResponseError(201); return parsed.data;
}
export async function listWaitlist(applicationId: string) {
  const parsed = waitlistListSchema.safeParse(await apiRequest(`/waitlist?applicationId=${applicationId}`, { cache: "no-store" }));
  if (!parsed.success) throw createInvalidResponseError(200); return parsed.data.entries;
}
export async function acceptOffer(id: string) {
  const parsed = appointmentSchema.safeParse(await apiRequest(`/offers/${id}/accept`, { method: "POST" }));
  if (!parsed.success) throw createInvalidResponseError(200); return parsed.data;
}
export async function declineOffer(id: string) {
  const parsed = waitlistEntrySchema.safeParse(await apiRequest(`/offers/${id}/decline`, { method: "POST" }));
  if (!parsed.success) throw createInvalidResponseError(200); return parsed.data;
}
