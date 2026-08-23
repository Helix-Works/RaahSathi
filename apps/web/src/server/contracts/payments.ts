import {
  createPaymentRequestSchema,
  paymentContextSchema,
  paymentProviderEventRequestSchema,
} from "@raahsathi/contracts/payments";
import { z } from "zod";

import type { EndpointContract } from "./endpoint";
import { requestIdHeaderContract } from "./health";

const headers = { "x-request-id": requestIdHeaderContract };
const applicationId = { name: "id", description: "Application UUID.", schema: z.uuid() } as const;
const paymentId = { name: "id", description: "Payment attempt UUID.", schema: z.uuid() } as const;
const mutationErrors = [
  { status: 400, description: "Strict validation or provider-event authentication failed." },
  { status: 401, description: "Authentication is required or expired." },
  { status: 403, description: "Origin, CSRF, or ownership validation failed." },
  { status: 404, description: "Owner-scoped resource was not found." },
  { status: 409, description: "Payment is not valid for the current workflow state." },
  { status: 413, description: "Request body exceeded the limit." },
  { status: 415, description: "Request body is not JSON." },
  { status: 500, description: "Sanitized server error." },
] as const;

export const paymentEndpointContracts: readonly EndpointContract[] = [
  {
    method: "post", path: "/api/v1/applications/{id}/payments", operationId: "startPayment",
    summary: "Create or resume a server-priced synthetic payment", pathParameters: [applicationId],
    request: { schemaName: "CreatePaymentRequest", schema: createPaymentRequestSchema },
    success: { status: 200, description: "Current convergent payment state.", schemaName: "PaymentContext", schema: paymentContextSchema, headers },
    errors: mutationErrors, security: ["cookieAuth"],
  },
  {
    method: "get", path: "/api/v1/payments/{id}", operationId: "getPayment",
    summary: "Get an owner-scoped synthetic payment", pathParameters: [paymentId],
    success: { status: 200, description: "Current payment state.", schemaName: "PaymentContext", schema: paymentContextSchema, headers },
    errors: mutationErrors.filter((error) => [400, 401, 404, 500].includes(error.status)), security: ["cookieAuth"],
  },
  {
    method: "post", path: "/api/v1/payment-provider/events", operationId: "receivePaymentProviderEvent",
    summary: "Receive an authenticated synthetic payment-provider result",
    request: { schemaName: "PaymentProviderEventRequest", schema: paymentProviderEventRequestSchema },
    requestHeaders: [{ name: "x-raahsathi-provider-signature", description: "HMAC-SHA-256 signature over the canonical synthetic event.", required: true, schema: z.string().startsWith("sha256=") }],
    success: { status: 200, description: "Converged payment state.", schemaName: "PaymentContext", schema: paymentContextSchema, headers },
    errors: mutationErrors.filter((error) => [400, 404, 413, 415, 500].includes(error.status)),
  },
];
