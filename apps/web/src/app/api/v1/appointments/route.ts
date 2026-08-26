import {
  appointmentListSchema,
  appointmentSchema,
  createAppointmentRequestSchema,
} from "@raahsathi/contracts/appointments";

import { bookAppointment, listAppointments } from "@/server/appointments/appointment-service";
import { requireAuthenticatedSession } from "@/server/auth/authorization";
import { requireMutationSecurity } from "@/server/auth/csrf";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { parseJsonBody } from "@/server/http/json-body";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const context = await requireAuthenticatedSession(request, correlationId);
    const response = Response.json(appointmentListSchema.parse({ appointments: await listAppointments(context) }));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}

export async function POST(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const session = await requireMutationSecurity(request, correlationId);
    const input = await parseJsonBody(request, createAppointmentRequestSchema);
    const response = Response.json(appointmentSchema.parse(await bookAppointment(session.context, {
      ...input,
      correlationId,
    })), { status: 201 });
    response.headers.set("cache-control", "no-store");
    return response;
  });
}
