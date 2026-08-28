/** Stable browser-safe service vocabulary retained at the package root. */
import type { ServiceKey } from "./applications.js";

export type { ServiceKey } from "./applications.js";
export type ServiceSummary = Readonly<{ serviceKey: ServiceKey }>;
