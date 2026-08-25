import {
  appointmentDateSchema,
  appointmentListSchema,
  appointmentSchema,
  createAppointmentRequestSchema,
  daySlotsSchema,
  monthAvailabilitySchema,
  monthParameterSchema,
  rtoListSchema,
} from "@raahsathi/contracts/appointments";
import { serviceKeySchema } from "@raahsathi/contracts/applications";
import { z } from "zod";

import type { EndpointContract } from "./endpoint";
import { requestIdHeaderContract } from "./health";

const headers = { "x-request-id": requestIdHeaderContract };
const rtoId = { name: "id", description: "Synthetic Delhi RTO UUID.", schema: z.uuid() } as const;
const appointmentId = { name: "id", description: "Appointment UUID.", schema: z.uuid() } as const;
const serviceQuery = { name: "service", description: "Licence service key.", required: true, schema: serviceKeySchema } as const;
const monthQuery = { name: "month", description: "Calendar month in YYYY-MM format.", required: true, schema: monthParameterSchema } as const;
const dateQuery = { name: "date", description: "Appointment date in YYYY-MM-DD format.", required: true, schema: appointmentDateSchema } as const;
const readErrors = [
  { status: 400, description: "Path or query validation failed." },
  { status: 404, description: "Synthetic RTO was not found." },
  { status: 500, description: "Sanitized server error." },
] as const;
const privateReadErrors = [
  { status: 401, description: "Authentication is required or expired." },
  { status: 500, description: "Sanitized server error." },
] as const;
const mutationErrors = [
  { status: 400, description: "Strict request validation failed." },
  { status: 401, description: "Authentication is required or expired." },
  { status: 403, description: "Origin, CSRF, or ownership validation failed." },
  { status: 404, description: "Owner-scoped application, appointment, or slot was not found." },
  { status: 409, description: "Application is ineligible or appointment capacity is unavailable." },
  { status: 413, description: "Request body exceeded the limit." },
  { status: 415, description: "Request body is not JSON." },
  { status: 429, description: "Appointment mutation rate limit reached." },
  { status: 500, description: "Sanitized server error." },
] as const;

export const appointmentEndpointContracts: readonly EndpointContract[] = [
  {
    method: "get", path: "/api/v1/rtos", operationId: "listRtos",
    summary: "List synthetic Delhi RTOs and dependency states",
    success: { status: 200, description: "Synthetic Delhi RTO list.", schemaName: "RtoList", schema: rtoListSchema, headers },
    errors: [{ status: 500, description: "Sanitized server error." }],
  },
  {
    method: "get", path: "/api/v1/rtos/{id}/availability", operationId: "getRtoMonthAvailability",
    summary: "Get backend-derived appointment availability for one month", pathParameters: [rtoId],
    queryParameters: [monthQuery, serviceQuery],
    success: { status: 200, description: "Month availability with explicit reason codes.", schemaName: "MonthAvailability", schema: monthAvailabilitySchema, headers },
    errors: readErrors,
  },
  {
    method: "get", path: "/api/v1/rtos/{id}/slots", operationId: "getRtoDaySlots",
    summary: "Get appointment time slots and authoritative remaining-capacity projections", pathParameters: [rtoId],
    queryParameters: [dateQuery, serviceQuery],
    success: { status: 200, description: "Day slots with explicit reason codes.", schemaName: "DaySlots", schema: daySlotsSchema, headers },
    errors: readErrors,
  },
  {
    method: "post", path: "/api/v1/appointments", operationId: "bookAppointment",
    summary: "Book an eligible application into a slot with atomic capacity enforcement",
    request: { schemaName: "CreateAppointmentRequest", schema: createAppointmentRequestSchema },
    success: { status: 201, description: "Confirmed owner-scoped appointment.", schemaName: "Appointment", schema: appointmentSchema, headers },
    errors: mutationErrors, security: ["cookieAuth"],
  },
  {
    method: "get", path: "/api/v1/appointments", operationId: "listAppointments",
    summary: "List the current applicant's appointments",
    success: { status: 200, description: "Owner-scoped appointment list.", schemaName: "AppointmentList", schema: appointmentListSchema, headers },
    errors: privateReadErrors, security: ["cookieAuth"],
  },
  {
    method: "post", path: "/api/v1/appointments/{id}/cancel", operationId: "cancelAppointment",
    summary: "Cancel an owner-scoped appointment and release its capacity", pathParameters: [appointmentId],
    success: { status: 200, description: "Cancelled owner-scoped appointment.", schemaName: "Appointment", schema: appointmentSchema, headers },
    errors: mutationErrors.filter((error) => error.status !== 413 && error.status !== 415), security: ["cookieAuth"],
  },
];
