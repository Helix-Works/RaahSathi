/** Stable browser-safe service vocabulary retained at the package root. */
export type ServiceKey = "LEARNER_LICENCE" | "PERMANENT_DRIVING_LICENCE" | "DRIVING_LICENCE_RENEWAL" | "DRIVING_LICENCE_ADDRESS_CHANGE";
export type ServiceSummary = Readonly<{ serviceKey: ServiceKey }>;
