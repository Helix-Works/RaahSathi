import type { ApplicationSummary } from "@raahsathi/contracts/applications";
import type { LicenceRecordSummary } from "@raahsathi/contracts/identity";
import type { ServiceSummary } from "@raahsathi/contracts";

export type DashboardApplicationSummary = ApplicationSummary;

export type DashboardAppointmentSummary = Readonly<{
  id: string;
  applicationId: string;
  rto: Readonly<{ nameEn: string; nameHi: string }>;
  date: string;
  startTime: string;
  endTime: string;
}>;

export type DashboardOfferSummary = Readonly<{
  id: string;
  applicationId: string;
  rto: Readonly<{ nameEn: string; nameHi: string }>;
  expiresAt: string;
}>;

export type DashboardWaitlistSummary = Readonly<{
  id: string;
  applicationId: string;
  rto: Readonly<{ nameEn: string; nameHi: string }>;
  joinedAt: string;
}>;

export type DashboardLicenceSummary = Readonly<{
  kind: LicenceRecordSummary["kind"];
  vehicleClass: LicenceRecordSummary["vehicleClass"];
}>;

export type DashboardSummary = Readonly<{
  applications: readonly DashboardApplicationSummary[];
  appointments: readonly DashboardAppointmentSummary[];
  offers: readonly DashboardOfferSummary[];
  waitlistEntries: readonly DashboardWaitlistSummary[];
  licences: readonly DashboardLicenceSummary[];
  services: readonly ServiceSummary[];
}>;
