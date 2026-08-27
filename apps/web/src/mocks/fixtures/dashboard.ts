import type { DashboardSummary } from "@/features/dashboard/types";

const millisecondsPerHour = 60 * 60 * 1_000;

function relativeIsoDate(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * millisecondsPerHour).toISOString();
}

export const activeDashboardFixture = {
  application: {
    id: "app_synthetic_permanent_dl",
    serviceKey: "PERMANENT_DRIVING_LICENCE",
    statusCode: "SLOT_OFFERED",
    progressPercent: 100,
    nextActionCode: "REVIEW_OFFER",
    blockingReasonCode: "NO_SUITABLE_SLOT",
    updatedAt: relativeIsoDate(-1),
  },
  offer: {
    id: "offer_synthetic_rohini",
    rto: { nameEn: "Synthetic Rohini RTO", nameHi: "कृत्रिम रोहिणी आरटीओ" },
    expiresAt: relativeIsoDate(2),
  },
  licence: {
    kind: "LEARNER",
    vehicleClass: "LMV",
  },
} as const satisfies DashboardSummary;

export const emptyDashboardFixture = {} as const satisfies DashboardSummary;

export const appointmentDashboardFixture = {
  application: {
    id: "app_synthetic_permanent_dl",
    serviceKey: "PERMANENT_DRIVING_LICENCE",
    statusCode: "APPOINTMENT_BOOKED",
    progressPercent: 100,
    nextActionCode: "REVIEW_APPOINTMENT",
    updatedAt: relativeIsoDate(-1),
  },
  appointment: {
    id: "appointment_synthetic_rohini",
    rto: { nameEn: "Synthetic Rohini RTO", nameHi: "कृत्रिम रोहिणी आरटीओ" },
    date: "2026-08-28",
    startTime: "10:00",
    endTime: "10:30",
  },
  licence: {
    kind: "LEARNER",
    vehicleClass: "LMV",
  },
} as const satisfies DashboardSummary;
