import {
  applicationDetailSchema,
  type ApplicationDetail,
  type ApplicationSectionData,
  type ApplicationSectionKey,
  type ServiceKey,
} from "@raahsathi/contracts/applications";

import { apiRequest, createInvalidResponseError } from "@/lib/api";

function parseApplication(payload: unknown): ApplicationDetail {
  const result = applicationDetailSchema.safeParse(payload);
  if (!result.success) throw createInvalidResponseError(200);
  return result.data;
}

export async function startApplication(serviceKey: ServiceKey): Promise<ApplicationDetail> {
  return parseApplication(await apiRequest("/applications", { method: "POST", json: { serviceKey } }));
}

export async function getApplication(applicationId: string): Promise<ApplicationDetail> {
  return parseApplication(await apiRequest(`/applications/${applicationId}`, {
    cache: "no-store",
  }));
}

export async function saveSection(input: Readonly<{
  applicationId: string; sectionKey: ApplicationSectionKey; expectedRevision: number; data: ApplicationSectionData;
}>): Promise<ApplicationDetail> {
  return parseApplication(await apiRequest(`/applications/${input.applicationId}/sections/${input.sectionKey}`, {
    method: "PATCH", json: { expectedRevision: input.expectedRevision, data: input.data },
  }));
}

export async function completeSection(applicationId: string, sectionKey: ApplicationSectionKey): Promise<ApplicationDetail> {
  return parseApplication(await apiRequest(`/applications/${applicationId}/steps/${sectionKey}/complete`, { method: "POST" }));
}
