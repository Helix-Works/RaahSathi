import type { Appointment, AvailabilityReasonCode } from "@raahsathi/contracts/appointments";
import { CalendarCheck2, CalendarX2, CircleAlert, Clock3, MapPinned } from "lucide-react";

import { DefinitionGrid, DefinitionItem, StageActionPanel } from "@/components/shared/journey-stage";
import { IconTile } from "@/components/shared/icon-tile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type AppointmentLabels = Readonly<{
  confirmed: string;
  confirmedBody: string;
  rto: string;
  date: string;
  time: string;
  bookedAt: string;
  review: string;
  service: string;
  confirm: string;
  confirming: string;
  change: string;
}>;

const unavailableReasons: readonly AvailabilityReasonCode[] = [
  "CAPACITY_FULL",
  "SLOTS_NOT_RELEASED",
  "SLOT_ELAPSED",
  "CENTER_UNAVAILABLE",
  "BOOKING_SERVICE_UNAVAILABLE",
];

function reasonIcon(reason: AvailabilityReasonCode) {
  if (reason === "CAPACITY_FULL") return CalendarX2;
  if (reason === "SLOTS_NOT_RELEASED" || reason === "SLOT_ELAPSED") return Clock3;
  return CircleAlert;
}

export function AvailabilityLegend({ reasons, label }: Readonly<{
  reasons: Readonly<Record<AvailabilityReasonCode, string>>;
  label: string;
}>) {
  return (
    <section aria-label={label} className="rounded-item border border-border bg-surface-muted p-3">
      <div className="grid gap-2 text-xs leading-5 sm:grid-cols-2 lg:grid-cols-3">
        {unavailableReasons.map((reason) => {
          const Icon = reasonIcon(reason);
          return <p key={reason} className="flex items-start gap-2 text-muted-foreground"><Icon className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />{reasons[reason]}</p>;
        })}
      </div>
    </section>
  );
}

export function ConfirmedAppointmentView({
  appointment,
  rtoName,
  district,
  date,
  bookedAt,
  labels,
}: Readonly<{
  appointment: Appointment;
  rtoName: string;
  district: string;
  date: string;
  bookedAt: string;
  labels: AppointmentLabels;
}>) {
  return (
    <section className="space-y-4" aria-labelledby="confirmed-appointment-title">
      <Alert variant="success" role="status" className="flex items-start gap-3">
        <IconTile size="sm" tone="success"><CalendarCheck2 aria-hidden="true" /></IconTile>
        <div className="space-y-1"><AlertTitle id="confirmed-appointment-title">{labels.confirmed}</AlertTitle><AlertDescription>{labels.confirmedBody}</AlertDescription></div>
      </Alert>
      <DefinitionGrid>
        <DefinitionItem label={labels.rto}><span>{rtoName}</span><span className="block text-sm font-normal text-muted-foreground">{district}</span></DefinitionItem>
        <DefinitionItem label={labels.date}>{date}</DefinitionItem>
        <DefinitionItem label={labels.time}>{appointment.startTime}–{appointment.endTime}</DefinitionItem>
        <DefinitionItem label={labels.bookedAt}>{bookedAt}</DefinitionItem>
      </DefinitionGrid>
    </section>
  );
}

export function AppointmentReview({
  rto,
  district,
  service,
  date,
  time,
  confirming,
  labels,
  onConfirm,
  onChange,
}: Readonly<{
  rto: string;
  district: string;
  service: string;
  date: string;
  time: string;
  confirming: boolean;
  labels: AppointmentLabels;
  onConfirm: () => void;
  onChange: () => void;
}>) {
  return (
    <section className="space-y-4 rounded-panel border border-primary/30 bg-secondary p-5" aria-labelledby="appointment-review-heading">
      <div className="flex items-start gap-3"><IconTile size="sm"><MapPinned aria-hidden="true" /></IconTile><h3 id="appointment-review-heading" className="pt-1 text-lg font-bold">{labels.review}</h3></div>
      <DefinitionGrid>
        <DefinitionItem label={labels.rto}><span>{rto}</span><span className="block text-sm font-normal text-muted-foreground">{district}</span></DefinitionItem>
        <DefinitionItem label={labels.service}>{service}</DefinitionItem>
        <DefinitionItem label={labels.date}>{date}</DefinitionItem>
        <DefinitionItem label={labels.time}>{time}</DefinitionItem>
      </DefinitionGrid>
      <StageActionPanel><div className="flex flex-wrap gap-2"><Button disabled={confirming} aria-busy={confirming} onClick={onConfirm}>{confirming ? labels.confirming : labels.confirm}</Button><Button variant="outline" disabled={confirming} onClick={onChange}>{labels.change}</Button></div></StageActionPanel>
    </section>
  );
}
