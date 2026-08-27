import {
  joinWaitlistRequestSchema,
  processWaitlistRequestSchema,
  updateWaitlistRequestSchema,
  waitlistEntrySchema,
  waitlistListSchema,
  type JoinWaitlistRequest,
  type WaitlistPreferences,
} from "@raahsathi/contracts/waitlist";
import { appointmentSchema } from "@raahsathi/contracts/appointments";

import { apiRequest, createInvalidResponseError } from "@/lib/api";

export async function joinWaitlist(input: JoinWaitlistRequest) {
  const request = joinWaitlistRequestSchema.parse(input);
  const parsed = waitlistEntrySchema.safeParse(
    await apiRequest("/waitlist", { method: "POST", json: request }),
  );
  if (!parsed.success) throw createInvalidResponseError(201);
  return parsed.data;
}

export async function listWaitlist(applicationId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ applicationId });
  const parsed = waitlistListSchema.safeParse(
    await apiRequest(`/waitlist?${query}`, { cache: "no-store", signal }),
  );
  if (!parsed.success) throw createInvalidResponseError(200);
  return parsed.data.entries;
}

export async function updateWaitlist(id: string, input: WaitlistPreferences) {
  const request = updateWaitlistRequestSchema.parse(input);
  const parsed = waitlistEntrySchema.safeParse(
    await apiRequest(`/waitlist/${id}`, { method: "PATCH", json: request }),
  );
  if (!parsed.success) throw createInvalidResponseError(200);
  return parsed.data;
}

export async function leaveWaitlist(id: string) {
  await apiRequest(`/waitlist/${id}`, { method: "DELETE" });
}

export async function processWaitlistState(applicationId: string) {
  const request = processWaitlistRequestSchema.parse({ applicationId });
  await apiRequest("/waitlist/process", { method: "POST", json: request });
}

export async function acceptOffer(id: string) {
  const parsed = appointmentSchema.safeParse(
    await apiRequest(`/offers/${id}/accept`, { method: "POST" }),
  );
  if (!parsed.success) throw createInvalidResponseError(200);
  return parsed.data;
}

export async function declineOffer(id: string) {
  const parsed = waitlistEntrySchema.safeParse(
    await apiRequest(`/offers/${id}/decline`, { method: "POST" }),
  );
  if (!parsed.success) throw createInvalidResponseError(200);
  return parsed.data;
}
