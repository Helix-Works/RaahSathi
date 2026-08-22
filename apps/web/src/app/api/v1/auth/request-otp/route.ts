import { otpChallengeSchema, requestOtpRequestSchema } from "@raahsathi/contracts/auth";

import { requestOtp } from "@/server/auth/auth-service";
import { assertSameOriginMutation } from "@/server/http/origin";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { parseJsonBody } from "@/server/http/json-body";

export const runtime = "nodejs";

type RequestOtpService = typeof requestOtp;

export function createRequestOtpHandler(service: RequestOtpService = requestOtp) {
  return async function requestOtpHandler(request: Request): Promise<Response> {
  return handleApiRequest(request, async ({ correlationId }) => {
    assertSameOriginMutation(request);
    const input = await parseJsonBody(request, requestOtpRequestSchema);
    const challenge = otpChallengeSchema.parse(await service(input.mobileNumber, correlationId));
    const response = Response.json(challenge, { status: 202 });
    response.headers.set("cache-control", "no-store");
    return response;
  });
  };
}

export const POST = createRequestOtpHandler();
