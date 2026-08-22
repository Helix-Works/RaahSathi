/** Stable browser-safe wire vocabulary shared by Route Handlers and clients. */
export type ServiceKey =
  | "LEARNER_LICENCE"
  | "PERMANENT_DRIVING_LICENCE";

export type ServiceSummary = Readonly<{
  serviceKey: ServiceKey;
}>;

// Intentionally unresolved until defined by later backend/OpenAPI contracts:
// ApplicationSummary, ApplicationDetail,
// ApplicationSection, and the authoritative public ApiError envelope.
