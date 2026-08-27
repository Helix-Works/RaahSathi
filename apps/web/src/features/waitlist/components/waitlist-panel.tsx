"use client";

import type { ApplicationDetail } from "@raahsathi/contracts/applications";
import type { Rto } from "@raahsathi/contracts/appointments";
import type { WaitlistEntry, WaitlistPreferences, WaitlistTimeBucket } from "@raahsathi/contracts/waitlist";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listRtos } from "@/features/appointments/api";
import { formatAppointmentDate } from "@/features/appointments/appointment-date";
import { acceptOffer, declineOffer, joinWaitlist, leaveWaitlist, listWaitlist, processWaitlistState, updateWaitlist } from "@/features/waitlist/api";
import { waitlistErrorPresentation, type WaitlistErrorPresentation } from "@/features/waitlist/waitlist-errors";
import { offerTiming } from "@/features/waitlist/offer-timing";
import type { Locale, MessageDictionary } from "@/i18n";

type Operation = "join" | "update" | "leave" | "accept" | "decline" | "process";
type Confirmation = "leave" | "decline" | undefined;

function delhiToday(): string {
  const fields = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => fields.find((field) => field.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function formatDateTime(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

function formatRemaining(milliseconds: number, locale: Locale): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  const number = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");
  return `${number.format(minutes)}:${number.format(remainder).padStart(2, "0")}`;
}

function preferencesFrom(entry: WaitlistEntry): WaitlistPreferences {
  return { rtoId: entry.rto.id, acceptableDateFrom: entry.acceptableDateFrom, acceptableDateTo: entry.acceptableDateTo, timeBuckets: entry.timeBuckets, vehicleClass: entry.vehicleClass };
}

export function WaitlistPanel({ application, locale, messages, onApplicationChanged }: Readonly<{
  application: ApplicationDetail;
  locale: Locale;
  messages: MessageDictionary;
  onApplicationChanged: () => Promise<void>;
}>) {
  const copy = messages.waitlist;
  const router = useRouter();
  const relevant = application.statusCode === "READY_FOR_APPOINTMENT" || application.statusCode === "WAITLISTED" || application.statusCode === "SLOT_OFFERED";
  const [entry, setEntry] = useState<WaitlistEntry>();
  const [rtos, setRtos] = useState<readonly Rto[]>([]);
  const [preferences, setPreferences] = useState<WaitlistPreferences>(() => ({ rtoId: "", acceptableDateFrom: delhiToday(), acceptableDateTo: delhiToday(), timeBuckets: ["MORNING"], vehicleClass: "LMV" }));
  const [rtoReloadKey, setRtoReloadKey] = useState(0);
  const [operation, setOperation] = useState<Operation>();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [error, setError] = useState<WaitlistErrorPresentation>();
  const [now, setNow] = useState(() => Date.now());
  const expiredReconciledFor = useRef<string | undefined>(undefined);
  const operationLock = useRef(false);
  const confirmationRef = useRef<HTMLElement | null>(null);

  const activeEntry = entry?.status === "ACTIVE" || entry?.status === "OFFERED" ? entry : undefined;
  const offer = activeEntry?.offer?.status === "ACTIVE" ? activeEntry.offer : undefined;
  const busy = operation !== undefined;

  const loadEntry = async (signal?: AbortSignal) => {
    const entries = await listWaitlist(application.id, signal);
    const next = entries.find((item) => item.status === "ACTIVE" || item.status === "OFFERED");
    setEntry(next);
    if (next) setPreferences(preferencesFrom(next));
    return next;
  };
  const synchronize = async (shouldProcess: boolean) => {
    if (shouldProcess) await processWaitlistState(application.id);
    return loadEntry();
  };

  useEffect(() => {
    if (!relevant) return;
    const controller = new AbortController();
    void (async () => {
      try {
        setOperation(application.statusCode === "WAITLISTED" || application.statusCode === "SLOT_OFFERED" ? "process" : undefined); setError(undefined);
        if (application.statusCode === "WAITLISTED" || application.statusCode === "SLOT_OFFERED") await processWaitlistState(application.id);
        await loadEntry(controller.signal);
        await onApplicationChanged();
      } catch (reason: unknown) {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(waitlistErrorPresentation(reason, locale, copy));
      } finally { setOperation(undefined); }
    })();
    return () => controller.abort();
  // The application status/id are the authoritative reconstruction boundary.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application.id, application.statusCode, relevant]);

  useEffect(() => {
    if (!relevant || rtos.length) return;
    const controller = new AbortController();
    void listRtos(controller.signal).then(setRtos).catch((reason: unknown) => {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(waitlistErrorPresentation(reason, locale, copy));
    });
    return () => controller.abort();
  }, [copy, locale, relevant, rtoReloadKey, rtos.length]);

  useEffect(() => {
    if (!offer) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [offer]);

  useEffect(() => {
    if (confirmation) confirmationRef.current?.focus();
  }, [confirmation]);

  useEffect(() => {
    if (!offer || !offerTiming(offer.expiresAt, now).acceptanceDisabled || expiredReconciledFor.current === offer.id) return;
    expiredReconciledFor.current = offer.id;
    void (async () => {
      try { setOperation("process"); setError(undefined); await processWaitlistState(application.id); await loadEntry(); await onApplicationChanged(); }
      catch (reason: unknown) { setError(waitlistErrorPresentation(reason, locale, copy)); }
      finally { setOperation(undefined); }
    })();
  // `loadEntry` is intentionally tied to the current render; the offer boundary is the only trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copy, locale, now, offer, onApplicationChanged, application.id]);

  const run = async (kind: Operation, action: () => Promise<void>, recover = false) => {
    if (operationLock.current) return;
    operationLock.current = true; setOperation(kind); setError(undefined);
    try { await action(); }
    catch (reason: unknown) {
      const next = waitlistErrorPresentation(reason, locale, copy); setError(next);
      if (recover || next.action === "recover") {
        try { await synchronize(true); await onApplicationChanged(); }
        catch (refreshReason: unknown) { setError(waitlistErrorPresentation(refreshReason, locale, copy)); }
      }
    } finally { operationLock.current = false; setOperation(undefined); }
  };

  const submitJoin = () => void run("join", async () => {
    await joinWaitlist({ applicationId: application.id, ...preferences });
    await synchronize(true); await onApplicationChanged();
  }, true);
  const submitUpdate = () => { if (!activeEntry) return; void run("update", async () => { await updateWaitlist(activeEntry.id, preferences); await synchronize(true); await onApplicationChanged(); }, true); };
  const refresh = () => void run("process", async () => { if (!rtos.length) setRtoReloadKey((value) => value + 1); await synchronize(true); await onApplicationChanged(); });
  const accept = () => { if (!offer || offerTiming(offer.expiresAt, Date.now()).acceptanceDisabled) return; void run("accept", async () => { await acceptOffer(offer.id); await onApplicationChanged(); await loadEntry(); }, true); };
  const completeConfirmation = () => {
    if (!activeEntry || !confirmation) return;
    const type = confirmation; setConfirmation(undefined);
    if (type === "leave") void run("leave", async () => { await leaveWaitlist(activeEntry.id); await onApplicationChanged(); await loadEntry(); }, true);
    if (type === "decline" && offer) void run("decline", async () => { await declineOffer(offer.id); await synchronize(true); await onApplicationChanged(); }, true);
  };
  const toggleBucket = (bucket: WaitlistTimeBucket) => setPreferences((current) => {
    const included = current.timeBuckets.includes(bucket);
    const timeBuckets = included ? current.timeBuckets.filter((item) => item !== bucket) : [...current.timeBuckets, bucket];
    return timeBuckets.length ? { ...current, timeBuckets } : current;
  });

  const valid = Boolean(preferences.rtoId) && preferences.acceptableDateFrom <= preferences.acceptableDateTo && preferences.timeBuckets.length > 0;
  const timing = offer ? offerTiming(offer.expiresAt, now) : { remainingMilliseconds: 0, acceptanceDisabled: true };
  const remaining = timing.remainingMilliseconds;
  if (!relevant) return null;

  return <Card><CardHeader><CardTitle>{offer ? copy.offerTitle : copy.title}</CardTitle><p className="text-sm text-muted-foreground">{offer ? copy.offerDescription : copy.description}</p></CardHeader><CardContent className="space-y-5">
    {error ? <Alert variant="error" role="alert"><AlertTitle>{copy.title}</AlertTitle><AlertDescription className="space-y-3"><p>{error.message}</p><Button variant="outline" onClick={() => error.action === "signin" ? router.push(`/login?returnTo=/applications/${application.id}`) : error.action === "reload" ? window.location.reload() : refresh()}>{error.action === "signin" ? messages.common.logIn : messages.common.retry}</Button></AlertDescription></Alert> : null}
    {operation === "process" ? <p role="status">{copy.processing}</p> : null}
    {offer ? <section className="space-y-4" aria-labelledby="slot-offer-details"><h3 id="slot-offer-details" className="sr-only">{copy.offerTitle}</h3><dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">{copy.rto}</dt><dd className="font-bold">{locale === "hi" ? activeEntry?.rto.nameHi : activeEntry?.rto.nameEn}</dd></div><div><dt className="text-sm text-muted-foreground">{copy.dateFrom}</dt><dd className="font-bold">{formatAppointmentDate(offer.slot.date, locale)}</dd></div><div><dt className="text-sm text-muted-foreground">{locale === "hi" ? "समय" : "Time"}</dt><dd className="font-bold">{offer.slot.startTime}–{offer.slot.endTime}</dd></div><div><dt className="text-sm text-muted-foreground">{copy.expires}</dt><dd className="font-bold">{formatDateTime(offer.expiresAt, locale)}</dd></div></dl><p className="font-bold"><span aria-hidden="true">{timing.acceptanceDisabled ? copy.offerExpired : `${copy.remaining}: ${formatRemaining(remaining, locale)}`}</span><span className="sr-only">{timing.acceptanceDisabled ? copy.offerExpired : `${copy.expires}: ${formatDateTime(offer.expiresAt, locale)}`}</span></p><div className="flex flex-wrap gap-2"><Button disabled={busy || timing.acceptanceDisabled} aria-busy={operation === "accept"} onClick={accept}>{operation === "accept" ? copy.accepting : copy.accept}</Button><Button variant="outline" disabled={busy} aria-busy={operation === "decline"} onClick={() => setConfirmation("decline")}>{operation === "decline" ? copy.declining : copy.decline}</Button><Button variant="ghost" disabled={busy} onClick={() => setConfirmation("leave")}>{copy.leave}</Button></div></section> : activeEntry ? <section className="space-y-4"><Alert role="status"><AlertTitle>{copy.waiting}</AlertTitle><AlertDescription>{copy.fifo}</AlertDescription></Alert><dl className="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">{copy.rto}</dt><dd className="font-bold">{locale === "hi" ? activeEntry.rto.nameHi : activeEntry.rto.nameEn}</dd></div><div><dt className="text-muted-foreground">{copy.joined}</dt><dd className="font-bold">{formatDateTime(activeEntry.joinedAt, locale)}</dd></div></dl><WaitlistForm copy={copy} locale={locale} preferences={preferences} rtos={rtos} busy={busy} onChange={setPreferences} onToggleBucket={toggleBucket} /><div className="flex flex-wrap gap-2"><Button disabled={busy || !valid} aria-busy={operation === "update"} onClick={submitUpdate}>{operation === "update" ? copy.updating : copy.update}</Button><Button variant="outline" disabled={busy} onClick={refresh}>{copy.refresh}</Button><Button variant="ghost" disabled={busy} onClick={() => setConfirmation("leave")}>{copy.leave}</Button></div></section> : <section className="space-y-4"><WaitlistForm copy={copy} locale={locale} preferences={preferences} rtos={rtos} busy={busy} onChange={setPreferences} onToggleBucket={toggleBucket} /><Button disabled={busy || !valid} aria-busy={operation === "join"} onClick={submitJoin}>{operation === "join" ? copy.joining : copy.join}</Button></section>}
    {confirmation ? <section ref={confirmationRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="waitlist-confirm-title" className="rounded-xl border-2 border-foreground p-4 outline-none focus-visible:ring-2 focus-visible:ring-foreground"><h3 id="waitlist-confirm-title" className="font-bold">{confirmation === "leave" ? copy.leaveTitle : copy.declineTitle}</h3><p className="mt-2 text-sm text-muted-foreground">{confirmation === "leave" ? copy.leaveDescription : copy.declineDescription}</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={completeConfirmation}>{confirmation === "leave" ? copy.confirmLeave : copy.confirmDecline}</Button><Button variant="ghost" onClick={() => setConfirmation(undefined)}>{copy.keep}</Button></div></section> : null}
  </CardContent></Card>;
}

function WaitlistForm({ copy, locale, preferences, rtos, busy, onChange, onToggleBucket }: Readonly<{ copy: MessageDictionary["waitlist"]; locale: Locale; preferences: WaitlistPreferences; rtos: readonly Rto[]; busy: boolean; onChange: (value: WaitlistPreferences) => void; onToggleBucket: (value: WaitlistTimeBucket) => void }>) {
  return <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label htmlFor="waitlist-rto">{copy.rto}</Label><select id="waitlist-rto" className="mt-1 min-h-11 w-full rounded-md border bg-card px-3" disabled={busy} value={preferences.rtoId} onChange={(event) => onChange({ ...preferences, rtoId: event.target.value })}><option value="">{locale === "hi" ? "आरटीओ चुनें" : "Choose an RTO"}</option>{rtos.filter((rto) => rto.status === "AVAILABLE").map((rto) => <option key={rto.id} value={rto.id}>{locale === "hi" ? rto.nameHi : rto.nameEn}</option>)}</select></div><div><Label htmlFor="waitlist-from">{copy.dateFrom}</Label><Input id="waitlist-from" type="date" disabled={busy} value={preferences.acceptableDateFrom} onChange={(event) => onChange({ ...preferences, acceptableDateFrom: event.target.value })} /></div><div><Label htmlFor="waitlist-to">{copy.dateTo}</Label><Input id="waitlist-to" type="date" min={preferences.acceptableDateFrom} disabled={busy} value={preferences.acceptableDateTo} onChange={(event) => onChange({ ...preferences, acceptableDateTo: event.target.value })} /></div><fieldset className="sm:col-span-2"><legend className="text-sm font-extrabold">{copy.buckets}</legend><div className="mt-2 flex flex-wrap gap-4"><label className="flex items-center gap-2"><input type="checkbox" checked={preferences.timeBuckets.includes("MORNING")} disabled={busy} onChange={() => onToggleBucket("MORNING")} />{copy.morning}</label><label className="flex items-center gap-2"><input type="checkbox" checked={preferences.timeBuckets.includes("AFTERNOON")} disabled={busy} onChange={() => onToggleBucket("AFTERNOON")} />{copy.afternoon}</label></div></fieldset><div><Label>{copy.vehicleClass}</Label><p className="mt-1 min-h-11 rounded-md border bg-muted px-3 py-2 font-bold">LMV</p></div></div>;
}
