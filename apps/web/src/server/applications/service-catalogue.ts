import "server-only";

import {
  serviceListSchema,
  type ServiceSummary,
} from "@raahsathi/contracts/applications";

const availableServices = serviceListSchema.parse([
  { serviceKey: "LEARNER_LICENCE" },
  { serviceKey: "PERMANENT_DRIVING_LICENCE" },
  { serviceKey: "DRIVING_LICENCE_RENEWAL" },
  { serviceKey: "DRIVING_LICENCE_ADDRESS_CHANGE" },
]);

export function listAvailableServices(): readonly ServiceSummary[] {
  return availableServices;
}
