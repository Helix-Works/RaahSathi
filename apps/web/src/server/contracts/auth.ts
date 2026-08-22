import {
  otpChallengeSchema,
  requestOtpRequestSchema,
  sessionSummarySchema,
  verifyOtpRequestSchema,
} from "@raahsathi/contracts/auth";
import { z } from "zod";

import type { EndpointContract, ResponseHeaderContract } from "./endpoint";
import { requestIdHeaderContract } from "./health";

const responseHeaders = { "x-request-id": requestIdHeaderContract };
export const retryAfterHeaderContract: ResponseHeaderContract = {
  componentName: "RetryAfter",
  description: "Seconds until the request may be retried.",
  schema: z.string().regex(/^[0-9]+$/),
};

export const requestOtpEndpointContract = {
  method: "post",
  path: "/api/v1/auth/request-otp",
  operationId: "requestOtp",
  summary: "Request a synthetic one-time password",
  request: { schemaName: "RequestOtpRequest", schema: requestOtpRequestSchema },
  success: { status: 202, description: "Synthetic OTP challenge accepted.", schemaName: "OtpChallenge", schema: otpChallengeSchema, headers: responseHeaders },
  errors: [
    { status: 400, description: "Strict request validation failed." },
    { status: 413, description: "Request body exceeded the limit." },
    { status: 415, description: "Request body is not JSON." },
    { status: 429, description: "OTP request cooldown or window limit reached.", headers: { ...responseHeaders, "retry-after": retryAfterHeaderContract } },
    { status: 503, description: "Synthetic OTP provider unavailable." },
    { status: 500, description: "Sanitized server error." },
  ],
} as const satisfies EndpointContract;

export const verifyOtpEndpointContract = {
  method: "post",
  path: "/api/v1/auth/verify-otp",
  operationId: "verifyOtp",
  summary: "Verify a synthetic OTP and create a session",
  request: { schemaName: "VerifyOtpRequest", schema: verifyOtpRequestSchema },
  success: { status: 200, description: "OTP verified and session created.", schemaName: "SessionSummary", schema: sessionSummarySchema, headers: responseHeaders },
  errors: [
    { status: 400, description: "OTP invalid, expired, or request invalid." },
    { status: 429, description: "OTP attempts exhausted." },
    { status: 500, description: "Sanitized server error." },
  ],
} as const satisfies EndpointContract;

export const meEndpointContract = {
  method: "get",
  path: "/api/v1/me",
  operationId: "getCurrentUser",
  summary: "Resolve the current database-backed session",
  success: { status: 200, description: "Current synthetic applicant.", schemaName: "SessionSummary", schema: sessionSummarySchema, headers: responseHeaders },
  errors: [
    { status: 401, description: "Session missing or expired." },
    { status: 500, description: "Sanitized server error." },
  ],
  security: ["cookieAuth"],
} as const satisfies EndpointContract;

export const logoutEndpointContract = {
  method: "post",
  path: "/api/v1/auth/logout",
  operationId: "logout",
  summary: "Revoke the current session",
  requestHeaders: [{ name: "x-csrf-token", description: "Session-bound CSRF token.", required: true, schema: z.string().min(1) }],
  success: { status: 204, description: "Session revoked or stale cookies cleared.", headers: responseHeaders },
  errors: [
    { status: 403, description: "Origin or CSRF validation failed." },
    { status: 500, description: "Sanitized server error." },
  ],
  security: ["cookieAuth"],
} as const satisfies EndpointContract;

export const authEndpointContracts: readonly EndpointContract[] = [
  requestOtpEndpointContract,
  verifyOtpEndpointContract,
  logoutEndpointContract,
  meEndpointContract,
];
