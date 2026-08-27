import type { ServiceKey } from "@raahsathi/contracts";

/** Provisional dashboard view data; backend status codes remain authoritative. */
export type DashboardApplicationSummary = Readonly<{
  id: string;
  serviceKey: ServiceKey;
  statusCode: string;
  progressPercent: number;
  nextActionCode: string;
  blockingReasonCode?: string;
  updatedAt: string;
}>;

export type DashboardAppointmentSummary = Readonly<{
  id: string;
  rto: Readonly<{ nameEn: string; nameHi: string }>;
  date: string;
  startTime: string;
  endTime: string;
}>;

export type DashboardOfferSummary = Readonly<{
  id: string;
  rto: Readonly<{ nameEn: string; nameHi: string }>;
  expiresAt: string;
}>;

export type DashboardWaitlistSummary = Readonly<{
  id: string;
  rto: Readonly<{ nameEn: string; nameHi: string }>;
  joinedAt: string;
}>;

export type DashboardLicenceSummary = Readonly<{
  labelCode: string;
  vehicleClassCode: string;
}>;

export type DashboardSummary = Readonly<{
  application?: DashboardApplicationSummary;
  appointment?: DashboardAppointmentSummary;
  offer?: DashboardOfferSummary;
  waitlist?: DashboardWaitlistSummary;
  licence?: DashboardLicenceSummary;
}>;
