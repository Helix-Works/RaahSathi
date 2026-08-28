"use client";

import type { ApplicationDetail } from "@raahsathi/contracts/applications";
import type { Appointment, DaySlots, MonthAvailability, Rto } from "@raahsathi/contracts/appointments";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { JourneyStageHeader, SelectableStageCard } from "@/components/shared/journey-stage";
import { Card, CardContent } from "@/components/ui/card";
import {
  bookAppointment,
  getRtoDaySlots,
  getRtoMonthAvailability,
  isAppointmentServiceKey,
  listAppointments,
  listRtos,
} from "@/features/appointments/api";
import {
  appointmentDayNumber,
  currentDelhiMonth,
  formatAppointmentDate,
  formatAppointmentMonth,
  shiftMonth,
} from "@/features/appointments/appointment-date";
import { beginAppointmentOperation, confirmedAppointmentForApplication, isActiveAppointmentRequest, isBookedReconstructionLoading } from "@/features/appointments/appointment-flow";
import { appointmentErrorPresentation } from "@/features/appointments/appointment-errors";
import { availabilityReasonMessage } from "@/features/appointments/availability-presentation";
import { AppointmentReview, AvailabilityLegend, ConfirmedAppointmentView } from "@/features/appointments/components/appointment-stage-views";
import type { Locale, MessageDictionary } from "@/i18n";

function localizedDistrict(district: string, locale: Locale): string {
  if (locale !== "hi") return district;

  const hindiDistricts: Readonly<Record<string, string>> = {
    "North Delhi": "उत्तरी दिल्ली",
    "North West Delhi": "उत्तर-पश्चिम दिल्ली",
    "South Delhi": "दक्षिण दिल्ली",
    "North East Delhi": "उत्तर-पूर्वी दिल्ली",
  };

  return hindiDistricts[district] ?? district;
}

export function AppointmentPanel({ application, initialAppointment, locale, messages, onApplicationChanged }: Readonly<{
  application: ApplicationDetail; initialAppointment?: Appointment; locale: Locale; messages: MessageDictionary["appointments"]; onApplicationChanged: () => Promise<void>;
}>) {
  const labels = messages;
  const router = useRouter();
  const [appointment, setAppointment] = useState(initialAppointment);
  const [rtos, setRtos] = useState<readonly Rto[]>([]);
  const [rtoId, setRtoId] = useState("");
  const [month, setMonth] = useState(() => currentDelhiMonth());
  const [availability, setAvailability] = useState<MonthAvailability>();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<DaySlots>();
  const [slotId, setSlotId] = useState("");
  const [loading, setLoading] = useState<"rtos" | "calendar" | "slots" | "reconstruct">();
  const [confirming, setConfirming] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<ReturnType<typeof appointmentErrorPresentation>>();
  const operationLock = useRef(false);
  const rtoRequest = useRef<AbortController | undefined>(undefined);
  const calendarRequest = useRef<AbortController | undefined>(undefined);
  const slotRequest = useRef<AbortController | undefined>(undefined);
  const errorRef = useRef<HTMLDivElement>(null);
  const relevant = ["READY_FOR_APPOINTMENT", "APPOINTMENT_BOOKED"].includes(application.statusCode);
  const appointmentServiceKey = isAppointmentServiceKey(application.serviceKey) ? application.serviceKey : null;

  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => {
    if (!relevant || appointment || application.statusCode !== "APPOINTMENT_BOOKED") return;
    const controller = new AbortController();
    void Promise.resolve().then(() => { setLoading("reconstruct"); return listAppointments(controller.signal); }).then((items) => {
      setAppointment(confirmedAppointmentForApplication(items, application.id));
      if (!confirmedAppointmentForApplication(items, application.id)) setError({ message: labels.reconstruct, action: "retry" });
    }).catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(appointmentErrorPresentation(reason, locale)); }).finally(() => setLoading(undefined));
    return () => controller.abort();
  }, [application.id, application.statusCode, appointment, labels, locale, relevant]);
  useEffect(() => {
    if (!relevant || application.statusCode !== "READY_FOR_APPOINTMENT") return;
    rtoRequest.current?.abort();
    const controller = new AbortController();
    rtoRequest.current = controller;
    void Promise.resolve().then(() => {
      if (!isActiveAppointmentRequest(rtoRequest.current, controller)) return undefined;
      setLoading("rtos"); setError(undefined); return listRtos(controller.signal);
    }).then((items) => {
      if (!items || !isActiveAppointmentRequest(rtoRequest.current, controller)) return;
      setRtos(items); setRtoId((current) => current || items.find((rto) => rto.status === "AVAILABLE")?.id || "");
    }).catch((reason: unknown) => {
      if (!isActiveAppointmentRequest(rtoRequest.current, controller)) return;
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(appointmentErrorPresentation(reason, locale));
    }).finally(() => { if (isActiveAppointmentRequest(rtoRequest.current, controller)) setLoading(undefined); });
    return () => { controller.abort(); if (rtoRequest.current === controller) rtoRequest.current = undefined; };
  }, [application.statusCode, locale, relevant, reloadKey]);
  useEffect(() => {
    if (!rtoId || !appointmentServiceKey || application.statusCode !== "READY_FOR_APPOINTMENT") return;
    calendarRequest.current?.abort();
    slotRequest.current?.abort();
    slotRequest.current = undefined;
    const controller = new AbortController();
    calendarRequest.current = controller;
    void Promise.resolve().then(() => {
      if (!isActiveAppointmentRequest(calendarRequest.current, controller)) return undefined;
      setLoading("calendar"); setAvailability(undefined); setDate(""); setSlots(undefined); setSlotId(""); setError(undefined);
      return getRtoMonthAvailability(rtoId, month, appointmentServiceKey, controller.signal);
    }).then((result) => {
      if (result && isActiveAppointmentRequest(calendarRequest.current, controller)) setAvailability(result);
    }).catch((reason: unknown) => {
      if (!isActiveAppointmentRequest(calendarRequest.current, controller)) return;
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(appointmentErrorPresentation(reason, locale));
    }).finally(() => { if (isActiveAppointmentRequest(calendarRequest.current, controller)) setLoading(undefined); });
    return () => {
      controller.abort();
      if (calendarRequest.current === controller) calendarRequest.current = undefined;
      slotRequest.current?.abort();
      slotRequest.current = undefined;
    };
  }, [appointmentServiceKey, application.statusCode, locale, month, reloadKey, rtoId]);

  useEffect(() => () => { slotRequest.current?.abort(); slotRequest.current = undefined; }, []);

  if (!relevant) return null;
  const selectedRto = rtos.find((rto) => rto.id === rtoId);
  const selectedSlot = slots?.slots.find((slot) => slot.slotId === slotId);
  const loadSlots = (chosenDate: string) => {
    if (!appointmentServiceKey) return;
    slotRequest.current?.abort();
    const controller = new AbortController(); slotRequest.current = controller; setDate(chosenDate); setSlotId(""); setSlots(undefined); setLoading("slots"); setError(undefined);
    void getRtoDaySlots(rtoId, chosenDate, appointmentServiceKey, controller.signal)
      .then((result) => { if (isActiveAppointmentRequest(slotRequest.current, controller)) setSlots(result); })
      .catch((reason: unknown) => {
        if (!isActiveAppointmentRequest(slotRequest.current, controller)) return;
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(appointmentErrorPresentation(reason, locale));
      })
      .finally(() => { if (isActiveAppointmentRequest(slotRequest.current, controller)) setLoading(undefined); });
  };
  const reconstruct = async () => {
    setLoading("reconstruct"); setError(undefined);
    try {
      const reconstructed = confirmedAppointmentForApplication(await listAppointments(), application.id);
      if (!reconstructed) { setError({ message: labels.reconstruct, action: "retry" }); return; }
      setAppointment(reconstructed); await onApplicationChanged();
    }
    catch (reason: unknown) { setError(appointmentErrorPresentation(reason, locale)); }
    finally { setLoading(undefined); }
  };
  const confirm = async () => {
    if (!selectedSlot || !beginAppointmentOperation(operationLock)) return;
    setConfirming(true); setError(undefined);
    try { const created = await bookAppointment(application.id, selectedSlot.slotId); setAppointment(created); await onApplicationChanged(); }
    catch (reason: unknown) {
      const nextError = appointmentErrorPresentation(reason, locale); setError(nextError);
      if (nextError.action === "reconstruct") await reconstruct();
      else if (nextError.action === "refresh-calendar") { setDate(""); setSlots(undefined); setSlotId(""); setReloadKey((value) => value + 1); }
      else { setSlotId(""); if (date) loadSlots(date); }
    } finally { operationLock.current = false; setConfirming(false); }
  };
  const retry = () => { if (error?.action === "signin") router.push(`/login?returnTo=/applications/${application.id}`); else if (error?.action === "reload") window.location.reload(); else if (error?.action === "reconstruct" || application.statusCode === "APPOINTMENT_BOOKED") void reconstruct(); else if (error?.action === "refresh-slots" && date) loadSlots(date); else { setDate(""); setSlots(undefined); setSlotId(""); setReloadKey((value) => value + 1); } };

  return <Card><JourneyStageHeader title={labels.title} description={labels.intro} icon={CalendarDays} /><CardContent className="space-y-6 pt-5 sm:pt-6">
    {error ? <Alert ref={errorRef} tabIndex={-1} variant="error"><AlertTitle>{labels.generic}</AlertTitle><AlertDescription className="space-y-3"><p>{error.message}</p><Button variant="outline" onClick={retry}>{error.action === "signin" ? labels.signIn : error.action === "reload" ? labels.reload : labels.retry}</Button></AlertDescription></Alert> : null}
    {appointment ? <ConfirmedAppointmentView appointment={appointment} rtoName={locale === "hi" ? appointment.rto.nameHi : appointment.rto.nameEn} district={localizedDistrict(appointment.rto.district, locale)} date={formatAppointmentDate(appointment.date, locale)} bookedAt={new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(appointment.bookedAt))} labels={labels} /> : application.statusCode === "APPOINTMENT_BOOKED" ? isBookedReconstructionLoading(application.statusCode, loading) ? <p role="status">{labels.loadingSlots}</p> : null : <>
      <section className="space-y-3" aria-labelledby="appointment-rto-heading"><h3 id="appointment-rto-heading" className="font-bold">1. {labels.rto}</h3>
        {loading === "rtos" ? <p role="status">{labels.loadingRtos}</p> : rtos.length === 0 ? <p>{labels.noRtos}</p> : <div className="grid gap-3 sm:grid-cols-2">{rtos.map((rto) => <SelectableStageCard key={rto.id} type="button" disabled={rto.status !== "AVAILABLE"} selected={rtoId === rto.id} onClick={() => setRtoId(rto.id)}><span className="block font-bold">{locale === "hi" ? rto.nameHi : rto.nameEn}</span><span className="block text-sm text-muted-foreground">{localizedDistrict(rto.district, locale)}</span>{rto.status !== "AVAILABLE" ? <span className="mt-2 block text-xs leading-5">{availabilityReasonMessage(rto.status, messages)}</span> : null}</SelectableStageCard>)}</div>}
      </section>
      {rtoId ? <section className="space-y-3" aria-labelledby="appointment-calendar-heading"><div className="flex items-center justify-between gap-2"><h3 id="appointment-calendar-heading" className="font-bold">2. {labels.calendar}</h3><div className="flex items-center gap-1"><Button variant="outline" size="icon" aria-label={labels.previous} disabled={month <= currentDelhiMonth()} onClick={() => setMonth((value) => shiftMonth(value, -1))}><ChevronLeft aria-hidden="true" /></Button><span className="min-w-32 text-center font-bold">{formatAppointmentMonth(month, locale)}</span><Button variant="outline" size="icon" aria-label={labels.next} onClick={() => setMonth((value) => shiftMonth(value, 1))}><ChevronRight aria-hidden="true" /></Button></div></div>
        <AvailabilityLegend reasons={messages.reasons} label={labels.availabilityLegend} />
        {loading === "calendar" ? <p role="status">{labels.loadingCalendar}</p> : availability ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{availability.days.map((day) => <SelectableStageCard key={day.date} type="button" disabled={day.status !== "AVAILABLE"} selected={date === day.date} onClick={() => loadSlots(day.date)} className="min-h-24 p-3"><span className="block text-lg font-bold">{appointmentDayNumber(day.date, locale)}</span><span className="mt-1 block text-xs leading-5">{day.status === "AVAILABLE" ? labels.remaining.replace("{count}", new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(day.availableSlots)) : availabilityReasonMessage(day.status, messages)}</span></SelectableStageCard>)}</div> : null}
      </section> : null}
      {date ? <section className="space-y-3" aria-labelledby="appointment-slots-heading"><h3 id="appointment-slots-heading" className="font-bold">3. {labels.slots} · {formatAppointmentDate(date, locale)}</h3>{loading === "slots" ? <p role="status">{labels.loadingSlots}</p> : slots?.slots.length ? <div className="grid gap-3 sm:grid-cols-2">{slots.slots.map((slot) => <SelectableStageCard key={slot.slotId} type="button" disabled={slot.status !== "AVAILABLE" || confirming} selected={slotId === slot.slotId} onClick={() => setSlotId(slot.slotId)}><span className="font-bold">{slot.startTime}–{slot.endTime}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{slot.status === "AVAILABLE" ? labels.remaining.replace("{count}", new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(slot.remaining)) : availabilityReasonMessage(slot.status, messages)}</span></SelectableStageCard>)}</div> : <p>{labels.noSlots}</p>}</section> : null}
      {selectedRto && selectedSlot && date ? <AppointmentReview rto={locale === "hi" ? selectedRto.nameHi : selectedRto.nameEn} district={localizedDistrict(selectedRto.district, locale)} service={application.serviceKey === "LEARNER_LICENCE" ? labels.learner : labels.permanent} date={formatAppointmentDate(date, locale)} time={`${selectedSlot.startTime}–${selectedSlot.endTime}`} confirming={confirming} labels={labels} onConfirm={() => void confirm()} onChange={() => setSlotId("")} /> : null}
    </>}
  </CardContent></Card>;
}
