"use client";

import type { ApplicationDetail } from "@raahsathi/contracts/applications";
import type { DaySlots, MonthAvailability, Rto } from "@raahsathi/contracts/appointments";
import type { WaitlistEntry } from "@raahsathi/contracts/waitlist";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookSlot, declineOffer, getAvailability, getRtos, getSlots, joinWaitlist, listWaitlist, acceptOffer } from "@/features/appointments/api";
import type { Locale } from "@/i18n";

export function AppointmentPanel({ application, locale, onApplicationChanged }: Readonly<{ application: ApplicationDetail; locale: Locale; onApplicationChanged: () => Promise<void> }>) {
  const hi = locale === "hi";
  const [rtos, setRtos] = useState<readonly Rto[]>([]); const [rtoId, setRtoId] = useState("");
  const month = new Date().toISOString().slice(0, 7); const [availability, setAvailability] = useState<MonthAvailability>();
  const [date, setDate] = useState(""); const [slots, setSlots] = useState<DaySlots>(); const [entries, setEntries] = useState<readonly WaitlistEntry[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string>();
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const buckets = ["MORNING", "AFTERNOON"] as const;
  const service = application.serviceKey;
  const activeEntry = entries[0]; const activeOffer = activeEntry?.offer?.status === "ACTIVE" ? activeEntry.offer : undefined;
  const labels = useMemo(() => hi ? { title: "अपॉइंटमेंट चुनें या वेटलिस्ट में शामिल हों", rto: "आरटीओ", date: "तारीख", load: "उपलब्धता देखें", book: "यह स्लॉट बुक करें", wait: "वेटलिस्ट में शामिल हों", waiting: "वेटलिस्ट में प्रतीक्षा", accept: "ऑफर स्वीकार करें", decline: "ऑफर अस्वीकार करें", unavailable: "यह स्लॉट उपलब्ध नहीं है", error: "कोशिश पूरी नहीं हुई" } : { title: "Choose an appointment or join the waitlist", rto: "RTO", date: "Date", load: "View availability", book: "Book this slot", wait: "Join waitlist", waiting: "Waiting for a suitable slot", accept: "Accept offer", decline: "Decline offer", unavailable: "This slot is unavailable", error: "The request could not be completed" }, [hi]);
  useEffect(() => { void getRtos().then((value) => { setRtos(value); setRtoId(value[0]?.id ?? ""); }).catch(() => setError(labels.error)); }, [labels.error]);
  useEffect(() => { if (!rtoId) return; void getAvailability(rtoId, month, service).then(setAvailability).catch(() => setError(labels.error)); void listWaitlist(application.id).then(setEntries).catch(() => undefined); }, [application.id, month, rtoId, service, labels.error]);
  const loadSlots = async (chosen: string) => { setDate(chosen); try { setSlots(await getSlots(rtoId, chosen, service)); } catch { setError(labels.error); } };
  const run = async (operation: () => Promise<unknown>) => { setBusy(true); setError(undefined); try { await operation(); await onApplicationChanged(); if (rtoId) setEntries(await listWaitlist(application.id)); } catch { setError(labels.error); } finally { setBusy(false); } };
  if (!["READY_FOR_APPOINTMENT", "WAITLISTED", "SLOT_OFFERED", "APPOINTMENT_BOOKED"].includes(application.statusCode)) return null;
  return <Card><CardHeader><CardTitle>{labels.title}</CardTitle></CardHeader><CardContent className="space-y-4">
    {error ? <Alert variant="error"><AlertTitle>{labels.error}</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
    {activeOffer ? <Alert><AlertTitle>{hi ? "अस्थायी स्लॉट ऑफर" : "Temporary slot offer"}</AlertTitle><AlertDescription><div className="space-y-2"><p>{new Date(activeOffer.slot.date).toLocaleDateString(hi ? "hi-IN" : "en-IN")} · {activeOffer.slot.startTime}–{activeOffer.slot.endTime}</p><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void run(() => acceptOffer(activeOffer.id))}>{labels.accept}</Button><Button variant="outline" disabled={busy} onClick={() => void run(() => declineOffer(activeOffer.id))}>{labels.decline}</Button></div></div></AlertDescription></Alert> : null}
    {application.statusCode === "APPOINTMENT_BOOKED" ? <p className="font-semibold">{hi ? "आपका अपॉइंटमेंट पुष्ट है।" : "Your appointment is confirmed."}</p> : null}
    {application.statusCode !== "APPOINTMENT_BOOKED" && !activeOffer ? <>
      <label className="grid gap-1 text-sm font-semibold">{labels.rto}<select className="rounded-md border bg-background p-2" value={rtoId} onChange={(event) => { setRtoId(event.target.value); setDate(""); setSlots(undefined); }}>{rtos.map((rto) => <option key={rto.id} value={rto.id}>{hi ? rto.nameHi : rto.nameEn}</option>)}</select></label>
      {availability ? <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{availability.days.filter((day) => day.date >= new Date().toISOString().slice(0, 10)).slice(0, 14).map((day) => <Button key={day.date} variant={date === day.date ? "default" : "outline"} className="h-auto min-h-16 px-1 text-xs" onClick={() => void loadSlots(day.date)}>{day.date.slice(8)}<span className="block">{day.status === "AVAILABLE" ? day.availableSlots : day.status}</span></Button>)}</div> : null}
      {slots ? <div className="grid gap-2 sm:grid-cols-2">{slots.slots.map((slot) => <Button key={slot.slotId} variant="outline" disabled={slot.status !== "AVAILABLE" || busy} onClick={() => void run(() => bookSlot(application.id, slot.slotId))}>{slot.startTime}–{slot.endTime} · {slot.status === "AVAILABLE" ? labels.book : labels.unavailable}</Button>)}</div> : null}
      {application.statusCode !== "WAITLISTED" ? <div className="space-y-2 rounded-md border p-3"><p className="font-semibold">{labels.wait}</p><div className="grid gap-2 sm:grid-cols-2"><input aria-label={hi ? "आरंभ तारीख" : "Start date"} type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-md border bg-background p-2" /><input aria-label={hi ? "अंतिम तारीख" : "End date"} type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-md border bg-background p-2" /></div><Button disabled={busy || !from || !to} onClick={() => void run(() => joinWaitlist({ applicationId: application.id, rtoId, acceptableDateFrom: from, acceptableDateTo: to, timeBuckets: buckets, vehicleClass: "LMV" }))}>{labels.wait}</Button></div> : null}
    </> : null}
    {activeEntry && !activeOffer ? <p className="text-sm font-semibold">{labels.waiting}</p> : null}
  </CardContent></Card>;
}
