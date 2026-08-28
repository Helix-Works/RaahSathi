import "server-only";

import type { ServiceKey } from "@raahsathi/contracts/applications";

export function isLicenceMaintenanceService(serviceKey: ServiceKey): serviceKey is "DRIVING_LICENCE_RENEWAL" | "DRIVING_LICENCE_ADDRESS_CHANGE" {
  return serviceKey === "DRIVING_LICENCE_RENEWAL" || serviceKey === "DRIVING_LICENCE_ADDRESS_CHANGE";
}

export function serviceRequiresAppointment(serviceKey: ServiceKey): boolean {
  return serviceKey === "LEARNER_LICENCE" || serviceKey === "PERMANENT_DRIVING_LICENCE";
}

export function serviceRequiresPermanentLicence(serviceKey: ServiceKey): boolean {
  return isLicenceMaintenanceService(serviceKey);
}
