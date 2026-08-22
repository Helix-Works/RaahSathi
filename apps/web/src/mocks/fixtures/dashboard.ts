import type { DashboardSummary } from "@/features/dashboard/types";

export const activeDashboardFixture = {
  application: {
    id: "app_synthetic_permanent_dl",
    serviceKey: "PERMANENT_DRIVING_LICENCE",
    statusCode: "APPOINTMENT_REQUIRED",
    progressPercent: 68,
    nextActionCode: "REVIEW_OFFER",
    blockingReasonCode: "NO_SUITABLE_SLOT",
    updatedAt: "2026-08-23T09:30:00+05:30",
  },
  offer: {
    id: "offer_synthetic_rohini",
    rtoCode: "SYNTHETIC_ROHINI",
    expiresAt: "2026-08-23T18:30:00+05:30",
  },
  licence: {
    labelCode: "SYNTHETIC_LEARNER_CONTEXT",
    vehicleClassCode: "LMV",
  },
} as const satisfies DashboardSummary;

export const emptyDashboardFixture = {} as const satisfies DashboardSummary;

export const appointmentDashboardFixture = {
  application: {
    id: "app_synthetic_permanent_dl",
    serviceKey: "PERMANENT_DRIVING_LICENCE",
    statusCode: "APPOINTMENT_BOOKED",
    progressPercent: 76,
    nextActionCode: "NONE",
    updatedAt: "2026-08-23T10:00:00+05:30",
  },
  appointment: {
    id: "appointment_synthetic_rohini",
    rtoCode: "SYNTHETIC_ROHINI",
    startsAt: "2026-08-25T09:30:00+05:30",
  },
  licence: {
    labelCode: "SYNTHETIC_LEARNER_CONTEXT",
    vehicleClassCode: "LMV",
  },
} as const satisfies DashboardSummary;
