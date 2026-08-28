import type { ServiceSummary } from "@raahsathi/contracts";

export const serviceFixtures = [
  { serviceKey: "LEARNER_LICENCE" },
  { serviceKey: "PERMANENT_DRIVING_LICENCE" },
  { serviceKey: "DRIVING_LICENCE_RENEWAL" },
  { serviceKey: "DRIVING_LICENCE_ADDRESS_CHANGE" },
] as const satisfies readonly ServiceSummary[];
