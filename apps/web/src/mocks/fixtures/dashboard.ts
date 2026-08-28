import type { DashboardSummary } from "@/features/dashboard/types";
import { serviceFixtures } from "@/mocks/fixtures/services";

const millisecondsPerHour = 60 * 60 * 1_000;

function relativeIsoDate(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * millisecondsPerHour).toISOString();
}

function relativeIsoDay(daysFromNow: number): string {
  return relativeIsoDate(daysFromNow * 24).slice(0, 10);
}

export const activeDashboardFixture = {
  applications: [
    {
      id: "app_permanent_dl",
      serviceKey: "PERMANENT_DRIVING_LICENCE",
      statusCode: "SLOT_OFFERED",
      progressPercent: 100,
      nextActionCode: "REVIEW_OFFER",
      updatedAt: relativeIsoDate(-1),
    },
    {
      id: "app_learner_dl",
      serviceKey: "LEARNER_LICENCE",
      statusCode: "APPOINTMENT_BOOKED",
      progressPercent: 100,
      nextActionCode: "REVIEW_APPOINTMENT",
      updatedAt: relativeIsoDate(-48),
    },
  ],
  offers: [{
    id: "offer_rohini",
    applicationId: "app_permanent_dl",
    rto: { nameEn: "Rohini Mobility Centre", nameHi: "रोहिणी मोबिलिटी केंद्र" },
    expiresAt: relativeIsoDate(2),
  }],
  waitlistEntries: [],
  appointments: [],
  licences: [{ kind: "LEARNER", vehicleClass: "LMV" }],
  services: serviceFixtures,
} as const satisfies DashboardSummary;

export const emptyDashboardFixture = {
  applications: [],
  appointments: [],
  offers: [],
  waitlistEntries: [],
  licences: [],
  services: serviceFixtures,
} as const satisfies DashboardSummary;

export const appointmentDashboardFixture = {
  applications: [{
    id: "app_permanent_dl",
    serviceKey: "PERMANENT_DRIVING_LICENCE",
    statusCode: "APPOINTMENT_BOOKED",
    progressPercent: 100,
    nextActionCode: "REVIEW_APPOINTMENT",
    updatedAt: relativeIsoDate(-1),
  }],
  appointments: [{
    id: "appointment_rohini",
    applicationId: "app_permanent_dl",
    rto: { nameEn: "Rohini Mobility Centre", nameHi: "रोहिणी मोबिलिटी केंद्र" },
    date: relativeIsoDay(3),
    startTime: "10:00",
    endTime: "10:30",
  }],
  offers: [],
  waitlistEntries: [],
  licences: [{ kind: "LEARNER", vehicleClass: "LMV" }],
  services: serviceFixtures,
} as const satisfies DashboardSummary;
