import { appointmentDateSchema, daySlotsSchema } from "@raahsathi/contracts/appointments";
import { serviceKeySchema } from "@raahsathi/contracts/applications";
import { z } from "zod";

import { getDaySlots } from "@/server/appointments/appointment-service";
import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return handleApiRequest(request, async () => {
    const id = z.uuid().safeParse((await context.params).id);
    const url = new URL(request.url);
    const date = appointmentDateSchema.safeParse(url.searchParams.get("date"));
    const service = serviceKeySchema.safeParse(url.searchParams.get("service"));
    const fieldErrors: Record<string, string[]> = {};
    if (!id.success) fieldErrors.id = ["invalid_format"];
    if (!date.success) fieldErrors.date = ["invalid_format"];
    if (!service.success) fieldErrors.service = ["invalid_value"];
    if (!id.success || !date.success || !service.success) throw apiErrors.validation(fieldErrors);
    const response = Response.json(daySlotsSchema.parse(await getDaySlots({
      rtoId: id.data,
      date: date.data,
      serviceKey: service.data,
    })));
    response.headers.set("cache-control", "no-store");
    return response;
  });
}
