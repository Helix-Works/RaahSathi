import { apiErrors } from "@/server/http/api-error";
import { handleApiRequest } from "@/server/http/handle-api-request";

export const runtime = "nodejs";

async function notFound(request: Request): Promise<Response> {
  return handleApiRequest(request, () => {
    throw apiErrors.notFound();
  });
}

export { notFound as DELETE, notFound as GET, notFound as HEAD, notFound as OPTIONS, notFound as PATCH, notFound as POST, notFound as PUT };
