import { identityContextSchema, licenceListSchema, licenceRecordSchema } from "@raahsathi/contracts/identity";
import { z } from "zod";

import type { EndpointContract } from "./endpoint";
import { requestIdHeaderContract } from "./health";

const headers = { "x-request-id": requestIdHeaderContract };
const applicationId = { name: "id", description: "Application UUID.", schema: z.uuid() } as const;
const attemptId = { name: "attemptId", description: "Identity attempt UUID.", schema: z.uuid() } as const;
const licenceId = { name: "id", description: "Synthetic licence UUID.", schema: z.uuid() } as const;
const readErrors = [
  { status: 400, description: "Path validation failed." },
  { status: 401, description: "Authentication is required or expired." },
  { status: 404, description: "Owner-scoped resource was not found." },
  { status: 500, description: "Sanitized server error." },
] as const;
const mutationErrors = [
  ...readErrors,
  { status: 403, description: "Origin or CSRF validation failed." },
  { status: 409, description: "Identity transition or retry is not valid." },
] as const;

export const identityEndpointContracts: readonly EndpointContract[] = [
  {
    method: "get", path: "/api/v1/applications/{id}/identity-attempts/latest", operationId: "getIdentityContext",
    summary: "Get the latest synthetic identity outcome and document metadata", pathParameters: [applicationId],
    success: { status: 200, description: "Current owner-scoped identity context.", schemaName: "IdentityContext", schema: identityContextSchema, headers },
    errors: readErrors, security: ["cookieAuth"],
  },
  {
    method: "post", path: "/api/v1/applications/{id}/identity-attempts", operationId: "startIdentityAttempt",
    summary: "Start idempotent synthetic identity verification", pathParameters: [applicationId],
    success: { status: 200, description: "Persisted synthetic identity outcome.", schemaName: "IdentityContext", schema: identityContextSchema, headers },
    errors: mutationErrors, security: ["cookieAuth"],
  },
  {
    method: "post", path: "/api/v1/applications/{id}/identity-attempts/{attemptId}/retry", operationId: "retryIdentityAttempt",
    summary: "Retry a recoverable synthetic identity attempt", pathParameters: [applicationId, attemptId],
    success: { status: 200, description: "Persisted retry outcome.", schemaName: "IdentityContext", schema: identityContextSchema, headers },
    errors: mutationErrors, security: ["cookieAuth"],
  },
  {
    method: "get", path: "/api/v1/licences", operationId: "listLicences", summary: "List owner-scoped synthetic licence context",
    success: { status: 200, description: "Synthetic licence list.", schemaName: "LicenceList", schema: licenceListSchema, headers },
    errors: readErrors.filter((error) => error.status !== 400 && error.status !== 404), security: ["cookieAuth"],
  },
  {
    method: "get", path: "/api/v1/licences/{id}", operationId: "getLicence", summary: "Get one owner-scoped synthetic licence",
    pathParameters: [licenceId], success: { status: 200, description: "Synthetic licence detail.", schemaName: "LicenceRecord", schema: licenceRecordSchema, headers },
    errors: readErrors, security: ["cookieAuth"],
  },
];
