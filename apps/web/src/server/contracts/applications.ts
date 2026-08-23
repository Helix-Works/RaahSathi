import {
  applicationDetailSchema, applicationListSchema, createApplicationRequestSchema,
  saveApplicationSectionRequestSchema, serviceListSchema,
  applicationSectionKeySchema,
} from "@raahsathi/contracts/applications";
import { z } from "zod";

import type { EndpointContract } from "./endpoint";
import { requestIdHeaderContract } from "./health";

const headers = { "x-request-id": requestIdHeaderContract };
const idParameter = { name: "id", description: "Application UUID.", schema: z.uuid() } as const;
const sectionParameter = { name: "sectionKey", description: "Durable workflow section.", schema: applicationSectionKeySchema } as const;
const mutationBodyErrors = [
  { status: 400, description: "Strict request validation failed." },
  { status: 401, description: "Authentication is required or expired." },
  { status: 403, description: "Origin, CSRF, or ownership check failed." },
  { status: 404, description: "Application was not found." },
  { status: 409, description: "Revision conflict or invalid workflow transition." },
  { status: 413, description: "Request body exceeded the limit." },
  { status: 415, description: "Request body is not JSON." },
  { status: 500, description: "Sanitized server error." },
] as const;
const createErrors = mutationBodyErrors.filter((error) => ![404, 409].includes(error.status));
const listErrors = mutationBodyErrors.filter((error) => [401, 500].includes(error.status));
const detailErrors = mutationBodyErrors.filter((error) => [400, 401, 404, 500].includes(error.status));
const completionErrors = mutationBodyErrors.filter((error) => [400, 401, 403, 404, 409, 500].includes(error.status));

export const applicationEndpointContracts: readonly EndpointContract[] = [
  { method: "get", path: "/api/v1/services", operationId: "listServices", summary: "List available synthetic licence services", success: { status: 200, description: "Service catalogue.", schemaName: "ServiceList", schema: serviceListSchema, headers }, errors: [{ status: 500, description: "Sanitized server error." }] },
  { method: "post", path: "/api/v1/applications", operationId: "createApplication", summary: "Create or resume an application", request: { schemaName: "CreateApplicationRequest", schema: createApplicationRequestSchema }, success: { status: 201, description: "Durable application created or resumed.", schemaName: "ApplicationDetail", schema: applicationDetailSchema, headers }, errors: createErrors, security: ["cookieAuth"] },
  { method: "get", path: "/api/v1/applications", operationId: "listApplications", summary: "List the current applicant's applications", success: { status: 200, description: "Owner-scoped application list.", schemaName: "ApplicationList", schema: applicationListSchema, headers }, errors: listErrors, security: ["cookieAuth"] },
  { method: "get", path: "/api/v1/applications/{id}", operationId: "getApplication", summary: "Get application status, sections, and history", pathParameters: [idParameter], success: { status: 200, description: "Owner-scoped application detail.", schemaName: "ApplicationDetail", schema: applicationDetailSchema, headers }, errors: detailErrors, security: ["cookieAuth"] },
  { method: "patch", path: "/api/v1/applications/{id}/sections/{sectionKey}", operationId: "saveApplicationSection", summary: "Save a durable section draft", pathParameters: [idParameter, sectionParameter], request: { schemaName: "SaveApplicationSectionRequest", schema: saveApplicationSectionRequestSchema }, success: { status: 200, description: "Updated application.", schemaName: "ApplicationDetail", schema: applicationDetailSchema, headers }, errors: mutationBodyErrors, security: ["cookieAuth"] },
  { method: "post", path: "/api/v1/applications/{id}/steps/{sectionKey}/complete", operationId: "completeApplicationStep", summary: "Complete one valid workflow step", pathParameters: [idParameter, sectionParameter], success: { status: 200, description: "Updated application.", schemaName: "ApplicationDetail", schema: applicationDetailSchema, headers }, errors: completionErrors, security: ["cookieAuth"] },
];
