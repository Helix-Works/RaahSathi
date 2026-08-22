import type { ServiceSummary } from "@raahsathi/contracts";

export const serviceFixtures = [
  { serviceKey: "LEARNER_LICENCE" },
  { serviceKey: "PERMANENT_DRIVING_LICENCE" },
] as const satisfies readonly ServiceSummary[];
