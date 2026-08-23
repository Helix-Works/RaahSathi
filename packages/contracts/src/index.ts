/** Stable browser-safe service vocabulary retained at the package root. */
export type ServiceKey = "LEARNER_LICENCE" | "PERMANENT_DRIVING_LICENCE";
export type ServiceSummary = Readonly<{ serviceKey: ServiceKey }>;
