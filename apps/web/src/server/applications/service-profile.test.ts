import { describe, expect, it } from "vitest";

import {
  isLicenceMaintenanceService,
  serviceRequiresAppointment,
  serviceRequiresPermanentLicence,
} from "./service-profile";

describe("Phase 8 service profiles", () => {
  it.each([
    "LEARNER_LICENCE",
    "PERMANENT_DRIVING_LICENCE",
  ] as const)("keeps %s in the appointment journey", (serviceKey) => {
    expect(serviceRequiresAppointment(serviceKey)).toBe(true);
    expect(isLicenceMaintenanceService(serviceKey)).toBe(false);
    expect(serviceRequiresPermanentLicence(serviceKey)).toBe(false);
  });

  it.each([
    "DRIVING_LICENCE_RENEWAL",
    "DRIVING_LICENCE_ADDRESS_CHANGE",
  ] as const)("keeps %s in the permanent-licence maintenance journey", (serviceKey) => {
    expect(serviceRequiresAppointment(serviceKey)).toBe(false);
    expect(isLicenceMaintenanceService(serviceKey)).toBe(true);
    expect(serviceRequiresPermanentLicence(serviceKey)).toBe(true);
  });
});
