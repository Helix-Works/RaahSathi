/**
 * Stable, shared wire vocabulary only. Registered Zod/OpenAPI contracts remain authoritative.
 * Add generated request/response shapes here once their backend contracts exist.
 */
export type ServiceKey =
  | "LEARNER_LICENCE"
  | "PERMANENT_DRIVING_LICENCE";

export type ServiceSummary = Readonly<{
  serviceKey: ServiceKey;
}>;

// Intentionally unresolved until defined by the backend/OpenAPI contract:
// CurrentUser, SessionSummary, ApplicationSummary, ApplicationDetail,
// ApplicationSection, and the authoritative public ApiError envelope.
