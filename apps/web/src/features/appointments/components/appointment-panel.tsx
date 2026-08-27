"use client";

import type { ApplicationDetail } from "@raahsathi/contracts/applications";
import type { Appointment, DaySlots, MonthAvailability, Rto } from "@raahsathi/contracts/appointments";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  bookAppointment,
  getRtoDaySlots,
  getRtoMonthAvailability,
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
import type { Locale, MessageDictionary } from "@/i18n";

type Labels = ReturnType<typeof appointmentLabels>;

function localizedDistrict(district: string, locale: Locale): string {
  if (locale !== "hi") return district;

  const hindiDistricts: Readonly<Record<string, string>> = {
    "Synthetic Delhi": "कृत्रिम दिल्ली",
    "North Delhi": "उत्तरी दिल्ली",
    "North West Delhi": "उत्तर-पश्चिम दिल्ली",
    "South Delhi": "दक्षिण दिल्ली",
    "North East Delhi": "उत्तर-पूर्वी दिल्ली",
  };

  return hindiDistricts[district] ?? district;
}

function appointmentLabels(locale: Locale) {
  return locale === "hi" ? {
    title: "अपॉइंटमेंट चुनें", intro: "कृत्रिम दिल्ली आरटीओ, तारीख और उपलब्ध समय चुनें। क्षमता हमेशा सर्वर से आती है।",
    rto: "आरटीओ चुनें", calendar: "तारीख चुनें", slots: "समय चुनें", previous: "पिछला महीना", next: "अगला महीना",
    loadingRtos: "आरटीओ लोड हो रहे हैं…", loadingCalendar: "कैलेंडर लोड हो रहा है…", loadingSlots: "स्लॉट लोड हो रहे हैं…",
    noRtos: "अभी कोई आरटीओ उपलब्ध नहीं है।", noSlots: "इस तारीख के लिए कोई स्लॉट जारी नहीं किया गया है।",
    remaining: "{count} स्थान शेष", selected: "चुना गया", review: "बुकिंग की पुष्टि करें", service: "सेवा", learner: "लर्नर लाइसेंस", permanent: "स्थायी ड्राइविंग लाइसेंस",
    date: "तारीख", time: "समय", confirm: "अपॉइंटमेंट पक्का करें", confirming: "पुष्टि हो रही है…", change: "चयन बदलें",
    confirmed: "अपॉइंटमेंट पक्का है", confirmedBody: "यह विवरण सर्वर से दोबारा बनाया गया है और लॉगआउट या रीफ्रेश के बाद भी सुरक्षित रहता है।",
    bookedAt: "बुक किया गया", retry: "फिर कोशिश करें", reload: "पेज फिर लोड करें", signIn: "दोबारा साइन इन करें",
    unavailable: "यह चयन अब उपलब्ध नहीं है। नवीनतम उपलब्धता दिखाई गई है।", rateLimited: "बहुत अधिक प्रयास हुए। थोड़ी देर बाद फिर कोशिश करें।",
    session: "आपका सत्र समाप्त हो गया है। सुरक्षित रूप से जारी रखने के लिए दोबारा साइन इन करें।", csrf: "सुरक्षा टोकन पुराना हो गया है। पेज फिर लोड करें।",
    generic: "अपॉइंटमेंट सेवा अभी उत्तर नहीं दे सकी। आपकी आवेदन प्रगति सुरक्षित है।", reconstruct: "पुष्ट अपॉइंटमेंट विवरण लोड नहीं हो सका।",
  } : {
    title: "Choose an appointment", intro: "Choose a synthetic Delhi RTO, date, and available time. Capacity always comes from the server.",
    rto: "Choose an RTO", calendar: "Choose a date", slots: "Choose a time", previous: "Previous month", next: "Next month",
    loadingRtos: "Loading RTOs…", loadingCalendar: "Loading calendar…", loadingSlots: "Loading slots…",
    noRtos: "No RTO is available right now.", noSlots: "No slots have been released for this date.",
    remaining: "{count} places remaining", selected: "Selected", review: "Confirm your booking", service: "Service", learner: "Learner Licence", permanent: "Permanent Driving Licence",
    date: "Date", time: "Time", confirm: "Confirm appointment", confirming: "Confirming…", change: "Change selection",
    confirmed: "Appointment confirmed", confirmedBody: "These details were reconstructed from the server and remain safe after refresh or sign-out.",
    bookedAt: "Booked", retry: "Try again", reload: "Reload page", signIn: "Sign in again",
    unavailable: "That selection is no longer available. The latest availability is shown.", rateLimited: "Too many attempts were made. Wait briefly and try again.",
    session: "Your session has expired. Sign in again to continue safely.", csrf: "The security token is stale. Reload the page and try again.",
    generic: "The appointment service could not respond. Your application progress is safe.", reconstruct: "Confirmed appointment details could not be loaded.",
  };
}

function ConfirmedAppointment({ appointment, locale, labels }: Readonly<{ appointment: Appointment; locale: Locale; labels: Labels }>) {
  const name = locale === "hi" ? appointment.rto.nameHi : appointment.rto.nameEn;
  return <div className="space-y-4" role="status">
    <Alert><AlertTitle>{labels.confirmed}</AlertTitle><AlertDescription>{labels.confirmedBody}</AlertDescription></Alert>
    <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
      <div><dt className="text-sm text-muted-foreground">{labels.rto}</dt><dd className="font-bold">{name}</dd><dd className="text-sm text-muted-foreground">{localizedDistrict(appointment.rto.district, locale)}</dd></div>
      <div><dt className="text-sm text-muted-foreground">{labels.date}</dt><dd className="font-bold">{formatAppointmentDate(appointment.date, locale)}</dd></div>
      <div><dt className="text-sm text-muted-foreground">{labels.time}</dt><dd className="font-bold">{appointment.startTime}–{appointment.endTime}</dd></div>
      <div><dt className="text-sm text-muted-foreground">{labels.bookedAt}</dt><dd className="font-bold">{new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(appointment.bookedAt))}</dd></div>
    </dl>
  </div>;
}

export function AppointmentPanel({ application, initialAppointment, locale, messages, onApplicationChanged }: Readonly<{
  application: ApplicationDetail; initialAppointment?: Appointment; locale: Locale; messages: MessageDictionary["appointments"]; onApplicationChanged: () => Promise<void>;
}>) {
  const labels = useMemo(() => appointmentLabels(locale), [locale]);
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
    void Promise.resolve().then(() => { setLoading("rtos"); setError(undefined); return listRtos(controller.signal); }).then((items) => {
      if (!isActiveAppointmentRequest(rtoRequest.current, controller)) return;
      setRtos(items); setRtoId((current) => current || items.find((rto) => rto.status === "AVAILABLE")?.id || "");
    }).catch((reason: unknown) => {
      if (!isActiveAppointmentRequest(rtoRequest.current, controller)) return;
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(appointmentErrorPresentation(reason, locale));
    }).finally(() => { if (isActiveAppointmentRequest(rtoRequest.current, controller)) setLoading(undefined); });
    return () => { controller.abort(); if (rtoRequest.current === controller) rtoRequest.current = undefined; };
  }, [application.statusCode, locale, relevant, reloadKey]);
  useEffect(() => {
    if (!rtoId || application.statusCode !== "READY_FOR_APPOINTMENT") return;
    calendarRequest.current?.abort();
    const controller = new AbortController();
    calendarRequest.current = controller;
    void Promise.resolve().then(() => { setLoading("calendar"); setAvailability(undefined); setDate(""); setSlots(undefined); setSlotId(""); setError(undefined); return getRtoMonthAvailability(rtoId, month, application.serviceKey, controller.signal); }).then((result) => {
      if (isActiveAppointmentRequest(calendarRequest.current, controller)) setAvailability(result);
    }).catch((reason: unknown) => {
      if (!isActiveAppointmentRequest(calendarRequest.current, controller)) return;
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(appointmentErrorPresentation(reason, locale));
    }).finally(() => { if (isActiveAppointmentRequest(calendarRequest.current, controller)) setLoading(undefined); });
    return () => { controller.abort(); if (calendarRequest.current === controller) calendarRequest.current = undefined; };
  }, [application.serviceKey, application.statusCode, locale, month, reloadKey, rtoId]);

  useEffect(() => () => { slotRequest.current?.abort(); slotRequest.current = undefined; }, []);

  if (!relevant) return null;
  const selectedRto = rtos.find((rto) => rto.id === rtoId);
  const selectedSlot = slots?.slots.find((slot) => slot.slotId === slotId);
  const loadSlots = (chosenDate: string) => {
    slotRequest.current?.abort();
    const controller = new AbortController(); slotRequest.current = controller; setDate(chosenDate); setSlotId(""); setSlots(undefined); setLoading("slots"); setError(undefined);
    void getRtoDaySlots(rtoId, chosenDate, application.serviceKey, controller.signal)
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

  return <Card><CardHeader><CardTitle>{labels.title}</CardTitle><p className="text-sm text-muted-foreground">{labels.intro}</p></CardHeader><CardContent className="space-y-6">
    {error ? <Alert ref={errorRef} tabIndex={-1} variant="error"><AlertTitle>{labels.generic}</AlertTitle><AlertDescription className="space-y-3"><p>{error.message}</p><Button variant="outline" onClick={retry}>{error.action === "signin" ? labels.signIn : error.action === "reload" ? labels.reload : labels.retry}</Button></AlertDescription></Alert> : null}
    {appointment ? <ConfirmedAppointment appointment={appointment} locale={locale} labels={labels} /> : application.statusCode === "APPOINTMENT_BOOKED" ? isBookedReconstructionLoading(application.statusCode, loading) ? <p role="status">{labels.loadingSlots}</p> : null : <>
      <section className="space-y-3" aria-labelledby="appointment-rto-heading"><h3 id="appointment-rto-heading" className="font-bold">1. {labels.rto}</h3>
        {loading === "rtos" ? <p role="status">{labels.loadingRtos}</p> : rtos.length === 0 ? <p>{labels.noRtos}</p> : <div className="grid gap-2 sm:grid-cols-2">{rtos.map((rto) => <button key={rto.id} type="button" disabled={rto.status !== "AVAILABLE"} aria-pressed={rtoId === rto.id} onClick={() => setRtoId(rto.id)} className="rounded-xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-60 data-[selected=true]:border-primary data-[selected=true]:bg-accent" data-selected={rtoId === rto.id}><span className="block font-bold">{locale === "hi" ? rto.nameHi : rto.nameEn}</span><span className="block text-sm text-muted-foreground">{localizedDistrict(rto.district, locale)}</span>{rto.status !== "AVAILABLE" ? <span className="mt-1 block text-xs">{availabilityReasonMessage(rto.status, messages)}</span> : null}</button>)}</div>}
      </section>
      {rtoId ? <section className="space-y-3" aria-labelledby="appointment-calendar-heading"><div className="flex items-center justify-between gap-2"><h3 id="appointment-calendar-heading" className="font-bold">2. {labels.calendar}</h3><div className="flex items-center gap-1"><Button variant="outline" size="icon" aria-label={labels.previous} disabled={month <= currentDelhiMonth()} onClick={() => setMonth((value) => shiftMonth(value, -1))}><ChevronLeft aria-hidden="true" /></Button><span className="min-w-32 text-center font-bold">{formatAppointmentMonth(month, locale)}</span><Button variant="outline" size="icon" aria-label={labels.next} onClick={() => setMonth((value) => shiftMonth(value, 1))}><ChevronRight aria-hidden="true" /></Button></div></div>
        {loading === "calendar" ? <p role="status">{labels.loadingCalendar}</p> : availability ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{availability.days.map((day) => <button key={day.date} type="button" disabled={day.status !== "AVAILABLE"} aria-pressed={date === day.date} onClick={() => loadSlots(day.date)} className="min-h-24 rounded-lg border p-2 text-left disabled:cursor-not-allowed disabled:opacity-60 data-[selected=true]:border-primary data-[selected=true]:bg-accent" data-selected={date === day.date}><span className="block text-lg font-black">{appointmentDayNumber(day.date, locale)}</span><span className="block text-xs">{day.status === "AVAILABLE" ? labels.remaining.replace("{count}", new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(day.availableSlots)) : availabilityReasonMessage(day.status, messages)}</span></button>)}</div> : null}
      </section> : null}
      {date ? <section className="space-y-3" aria-labelledby="appointment-slots-heading"><h3 id="appointment-slots-heading" className="font-bold">3. {labels.slots} · {formatAppointmentDate(date, locale)}</h3>{loading === "slots" ? <p role="status">{labels.loadingSlots}</p> : slots?.slots.length ? <div className="grid gap-2 sm:grid-cols-2">{slots.slots.map((slot) => <button key={slot.slotId} type="button" disabled={slot.status !== "AVAILABLE" || confirming} aria-pressed={slotId === slot.slotId} onClick={() => setSlotId(slot.slotId)} className="rounded-xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-60 data-[selected=true]:border-primary data-[selected=true]:bg-accent" data-selected={slotId === slot.slotId}><span className="font-bold">{slot.startTime}–{slot.endTime}</span><span className="block text-sm text-muted-foreground">{slot.status === "AVAILABLE" ? labels.remaining.replace("{count}", new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(slot.remaining)) : availabilityReasonMessage(slot.status, messages)}</span></button>)}</div> : <p>{labels.noSlots}</p>}</section> : null}
      {selectedRto && selectedSlot && date ? <section className="space-y-4 rounded-xl border-2 border-primary p-4" aria-labelledby="appointment-review-heading"><h3 id="appointment-review-heading" className="text-lg font-black">4. {labels.review}</h3><dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">{labels.rto}</dt><dd className="font-bold">{locale === "hi" ? selectedRto.nameHi : selectedRto.nameEn}</dd><dd className="text-sm text-muted-foreground">{localizedDistrict(selectedRto.district, locale)}</dd></div><div><dt className="text-sm text-muted-foreground">{labels.service}</dt><dd className="font-bold">{application.serviceKey === "LEARNER_LICENCE" ? labels.learner : labels.permanent}</dd></div><div><dt className="text-sm text-muted-foreground">{labels.date}</dt><dd className="font-bold">{formatAppointmentDate(date, locale)}</dd></div><div><dt className="text-sm text-muted-foreground">{labels.time}</dt><dd className="font-bold">{selectedSlot.startTime}–{selectedSlot.endTime}</dd></div></dl><div className="flex flex-wrap gap-2"><Button disabled={confirming} aria-busy={confirming} onClick={() => void confirm()}>{confirming ? labels.confirming : labels.confirm}</Button><Button variant="outline" disabled={confirming} onClick={() => setSlotId("")}>{labels.change}</Button></div></section> : null}
    </>}
  </CardContent></Card>;
}
