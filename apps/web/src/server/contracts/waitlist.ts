import { appointmentSchema } from "@raahsathi/contracts/appointments";
import {
  joinWaitlistRequestSchema,
  processWaitlistRequestSchema,
  updateWaitlistRequestSchema,
  waitlistEntrySchema,
  waitlistListSchema,
} from "@raahsathi/contracts/waitlist";
import { z } from "zod";

import type { EndpointContract } from "./endpoint";
import { requestIdHeaderContract } from "./health";

const headers = { "x-request-id": requestIdHeaderContract };
const id = { name: "id", description: "Owner-scoped waitlist entry or offer UUID.", schema: z.uuid() } as const;
const mutationErrors = [
  { status: 400, description: "Strict validation failed." }, { status: 401, description: "Authentication required." },
  { status: 403, description: "Origin or CSRF rejected." }, { status: 404, description: "Owner-scoped resource not found." },
  { status: 409, description: "Waitlist or offer state conflict." }, { status: 429, description: "Mutation rate limit reached." },
  { status: 500, description: "Sanitized server error." },
] as const;
const jsonMutationErrors = [
  ...mutationErrors,
  { status: 413, description: "JSON request body exceeds the allowed size." },
  { status: 415, description: "JSON request body content type is unsupported." },
] as const;
const readErrors = [{ status: 401, description: "Authentication required." }, { status: 404, description: "Owner-scoped resource not found." },
  { status: 500, description: "Sanitized server error." }] as const;
const listReadErrors = [{ status: 400, description: "Query validation failed." },
  ...readErrors.filter((error) => error.status !== 404)] as const;

export const waitlistEndpointContracts: readonly EndpointContract[] = [
  { method: "post", path: "/api/v1/waitlist", operationId: "joinWaitlist", summary: "Join the compatible strict-FIFO waitlist",
    request: { schemaName: "JoinWaitlistRequest", schema: joinWaitlistRequestSchema },
    success: { status: 201, description: "Persisted waitlist entry.", schemaName: "WaitlistEntry", schema: waitlistEntrySchema, headers },
    errors: jsonMutationErrors, security: ["cookieAuth"] },
  { method: "post", path: "/api/v1/waitlist/process", operationId: "processWaitlistState", summary: "Expire and allocate waitlist state for one owned application",
    request: { schemaName: "ProcessWaitlistRequest", schema: processWaitlistRequestSchema },
    success: { status: 204, description: "Waitlist state processed.", headers },
    errors: jsonMutationErrors, security: ["cookieAuth"] },
  { method: "get", path: "/api/v1/waitlist", operationId: "listWaitlist", summary: "List the current applicant's waitlist entries",
    queryParameters: [{ name: "applicationId", description: "Optional application UUID filter.", required: false, schema: z.uuid() }],
    success: { status: 200, description: "Owner-scoped waitlist entries.", schemaName: "WaitlistList", schema: waitlistListSchema, headers },
    errors: listReadErrors, security: ["cookieAuth"] },
  { method: "get", path: "/api/v1/waitlist/{id}", operationId: "getWaitlist", summary: "Get one owner-scoped waitlist entry", pathParameters: [id],
    success: { status: 200, description: "Waitlist entry and latest offer.", schemaName: "WaitlistEntry", schema: waitlistEntrySchema, headers }, errors: readErrors, security: ["cookieAuth"] },
  { method: "patch", path: "/api/v1/waitlist/{id}", operationId: "updateWaitlist", summary: "Update preferences without changing FIFO join time", pathParameters: [id],
    request: { schemaName: "UpdateWaitlistRequest", schema: updateWaitlistRequestSchema },
    success: { status: 200, description: "Updated waitlist entry.", schemaName: "WaitlistEntry", schema: waitlistEntrySchema, headers }, errors: jsonMutationErrors, security: ["cookieAuth"] },
  { method: "delete", path: "/api/v1/waitlist/{id}", operationId: "leaveWaitlist", summary: "Leave the waitlist and release any active hold", pathParameters: [id],
    success: { status: 204, description: "Waitlist entry left.", headers }, errors: mutationErrors, security: ["cookieAuth"] },
  { method: "post", path: "/api/v1/offers/{id}/accept", operationId: "acceptSlotOffer", summary: "Accept an unexpired held slot", pathParameters: [id],
    success: { status: 200, description: "Confirmed appointment.", schemaName: "Appointment", schema: appointmentSchema, headers }, errors: mutationErrors, security: ["cookieAuth"] },
  { method: "post", path: "/api/v1/offers/{id}/decline", operationId: "declineSlotOffer", summary: "Decline an offer and reallocate its hold", pathParameters: [id],
    success: { status: 200, description: "Restored waitlist entry.", schemaName: "WaitlistEntry", schema: waitlistEntrySchema, headers }, errors: mutationErrors, security: ["cookieAuth"] },
];
