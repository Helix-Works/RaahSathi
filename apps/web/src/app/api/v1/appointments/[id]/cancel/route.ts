import { appointmentSchema } from "@raahsathi/contracts/appointments";
import { z } from "zod";

import { cancelAppointment } from "@/server/appointments/appointment-service";
import { requireMutationSecurity } from "@/server/auth/csrf";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    const id = z.uuid().safeParse((await context.params).id);
    if (!id.success) throw apiErrors.validation({ id: ["invalid_format"] });
    const session = await requireMutationSecurity(request, correlationId);
    const response = Response.json(appointmentSchema.parse(await cancelAppointment(session.context, {
      appointmentId: id.data,
      correlationId,
    })));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}
