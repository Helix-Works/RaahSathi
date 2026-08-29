"use client";

import type { ApplicationDetail } from "@raahsathi/contracts/applications";
import type { Rto } from "@raahsathi/contracts/appointments";
import type { WaitlistEntry, WaitlistPreferences, WaitlistTimeBucket } from "@raahsathi/contracts/waitlist";
import { ListOrdered, TicketCheck } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { useRouter } from "next/navigation";

import { JourneyStageHeader, StageActionPanel } from "@/components/shared/journey-stage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listRtos } from "@/features/appointments/api";
import { formatAppointmentDate } from "@/features/appointments/appointment-date";
import { acceptOffer, declineOffer, joinWaitlist, leaveWaitlist, listWaitlist, processWaitlistState, updateWaitlist } from "@/features/waitlist/api";
import { waitlistErrorPresentation, type WaitlistErrorPresentation } from "@/features/waitlist/waitlist-errors";
import { offerTiming } from "@/features/waitlist/offer-timing";
import { ActiveWaitlistSummary, TemporaryOfferView, WaitlistPreferencesForm } from "@/features/waitlist/components/waitlist-stage-views";
import type { Locale, MessageDictionary } from "@/i18n";

type Operation = "join" | "update" | "leave" | "accept" | "decline" | "process";
type Confirmation = "leave" | "decline" | undefined;
type OperationLease = Readonly<{
  applicationId: string;
  controller: AbortController;
  owner: symbol;
}>;

function ConfirmationDialog({
  confirmation,
  copy,
  dialogRef,
  onConfirm,
  onDismiss,
}: Readonly<{
  confirmation: Exclude<Confirmation, undefined>;
  copy: MessageDictionary["waitlist"];
  dialogRef: RefObject<HTMLDivElement | null>;
  onConfirm: () => void;
  onDismiss: () => void;
}>) {
  const title = confirmation === "leave" ? copy.leaveTitle : copy.declineTitle;
  const description = confirmation === "leave" ? copy.leaveDescription : copy.declineDescription;
  const confirmLabel = confirmation === "leave" ? copy.confirmLeave : copy.confirmDecline;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onDismiss();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/35 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-confirm-title"
        aria-describedby="waitlist-confirm-description"
        tabIndex={-1}
        className="w-full max-w-md rounded-panel border border-primary/25 bg-card p-5 shadow-elevated outline-none sm:p-6"
        onKeyDown={handleKeyDown}
      >
        <h3 id="waitlist-confirm-title" className="text-lg font-bold leading-snug">{title}</h3>
        <p id="waitlist-confirm-description" className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onDismiss}>{copy.keep}</Button>
          <Button variant="outline" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

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
  const currentApplicationId = useRef(application.id);
  const operationLock = useRef<OperationLease | undefined>(undefined);
  const confirmationRef = useRef<HTMLDivElement | null>(null);
  const confirmationReturnFocusRef = useRef<HTMLElement | null>(null);

  const activeEntry = entry?.status === "ACTIVE" || entry?.status === "OFFERED" ? entry : undefined;
  const offer = activeEntry?.offer?.status === "ACTIVE" ? activeEntry.offer : undefined;
  const busy = operation !== undefined;
  const offerExpired = offer ? offerTiming(offer.expiresAt, now).acceptanceDisabled : false;

  const acquireOperation = (label: string): OperationLease | undefined => {
    if (operationLock.current) return undefined;
    const lease = { applicationId: application.id, controller: new AbortController(), owner: Symbol(label) };
    operationLock.current = lease;
    return lease;
  };
  const ownsOperation = (lease: OperationLease): boolean =>
    operationLock.current === lease
    && currentApplicationId.current === lease.applicationId
    && !lease.controller.signal.aborted;
  const releaseOperation = (lease: OperationLease): boolean => {
    if (operationLock.current !== lease) return false;
    operationLock.current = undefined;
    return true;
  };
  const revokeOperation = (lease: OperationLease): void => {
    lease.controller.abort();
    releaseOperation(lease);
  };

  const loadEntry = async (lease: OperationLease) => {
    const entries = await listWaitlist(lease.applicationId, lease.controller.signal);
    const next = entries.find((item) => item.status === "ACTIVE" || item.status === "OFFERED");
    if (!ownsOperation(lease)) return next;
    setEntry(next);
    if (next) setPreferences(preferencesFrom(next));
    return next;
  };
  const synchronize = async (shouldProcess: boolean, lease: OperationLease) => {
    if (shouldProcess) await processWaitlistState(lease.applicationId);
    if (!ownsOperation(lease)) return undefined;
    return loadEntry(lease);
  };

  useEffect(() => {
    currentApplicationId.current = application.id;
    return () => {
      const lease = operationLock.current;
      if (lease?.applicationId === application.id) revokeOperation(lease);
    };
  // Revoke every operation captured by the application being replaced or unmounted.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application.id]);

  useEffect(() => {
    if (!relevant) return;
    const lease = acquireOperation("waitlist-initialization");
    if (!lease) return;
    void (async () => {
      try {
        setOperation("process"); setError(undefined);
        if (application.statusCode === "WAITLISTED" || application.statusCode === "SLOT_OFFERED") await processWaitlistState(lease.applicationId);
        if (!ownsOperation(lease)) return;
        await loadEntry(lease);
        if (!ownsOperation(lease)) return;
        await onApplicationChanged();
      } catch (reason: unknown) {
        if (ownsOperation(lease) && !(reason instanceof DOMException && reason.name === "AbortError")) setError(waitlistErrorPresentation(reason, locale, copy));
      } finally {
        if (releaseOperation(lease)) setOperation(undefined);
      }
    })();
    return () => {
      revokeOperation(lease);
    };
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
    if (confirmation) confirmationRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, [confirmation]);

  useEffect(() => {
    if (!offer || !offerExpired || expiredReconciledFor.current === offer.id) return;
    const lease = acquireOperation("waitlist-expiry");
    if (!lease) return;
    expiredReconciledFor.current = offer.id;
    void (async () => {
      try {
        setOperation("process"); setError(undefined);
        await processWaitlistState(lease.applicationId);
        if (!ownsOperation(lease)) return;
        await loadEntry(lease);
        if (!ownsOperation(lease)) return;
        await onApplicationChanged();
      }
      catch (reason: unknown) { if (ownsOperation(lease)) setError(waitlistErrorPresentation(reason, locale, copy)); }
      finally {
        if (releaseOperation(lease)) setOperation(undefined);
      }
    })();
    return () => revokeOperation(lease);
  // `loadEntry` is intentionally tied to the current render; the offer boundary is the only trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application.id, copy, locale, offer, offerExpired, onApplicationChanged]);

  const run = async (kind: Operation, action: (lease: OperationLease) => Promise<void>, recover = false) => {
    const lease = acquireOperation(`waitlist-${kind}`);
    if (!lease) return;
    setOperation(kind); setError(undefined);
    try { await action(lease); }
    catch (reason: unknown) {
      if (!ownsOperation(lease)) return;
      const next = waitlistErrorPresentation(reason, locale, copy); setError(next);
      if (recover || next.action === "recover") {
        try {
          await synchronize(true, lease);
          if (ownsOperation(lease)) await onApplicationChanged();
        }
        catch (refreshReason: unknown) { if (ownsOperation(lease)) setError(waitlistErrorPresentation(refreshReason, locale, copy)); }
      }
    } finally {
      if (releaseOperation(lease)) setOperation(undefined);
    }
  };

  const submitJoin = () => void run("join", async (lease) => {
    await joinWaitlist({ applicationId: lease.applicationId, ...preferences });
    if (!ownsOperation(lease)) return;
    await synchronize(true, lease);
    if (ownsOperation(lease)) await onApplicationChanged();
  }, true);
  const submitUpdate = () => { if (!activeEntry) return; void run("update", async (lease) => { await updateWaitlist(activeEntry.id, preferences); if (!ownsOperation(lease)) return; await synchronize(true, lease); if (ownsOperation(lease)) await onApplicationChanged(); }, true); };
  const refresh = () => void run("process", async (lease) => { if (!rtos.length && ownsOperation(lease)) setRtoReloadKey((value) => value + 1); await synchronize(true, lease); if (ownsOperation(lease)) await onApplicationChanged(); });
  const accept = () => { if (!offer || offerTiming(offer.expiresAt, Date.now()).acceptanceDisabled) return; void run("accept", async (lease) => { await acceptOffer(offer.id); if (!ownsOperation(lease)) return; await onApplicationChanged(); if (ownsOperation(lease)) await loadEntry(lease); }, true); };
  const openConfirmation = (type: Exclude<Confirmation, undefined>) => {
    confirmationReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConfirmation(type);
  };
  const dismissConfirmation = () => {
    setConfirmation(undefined);
    window.requestAnimationFrame(() => confirmationReturnFocusRef.current?.focus());
  };
  const completeConfirmation = () => {
    if (!activeEntry || !confirmation) return;
    const type = confirmation;
    dismissConfirmation();
    if (type === "leave") void run("leave", async (lease) => { await leaveWaitlist(activeEntry.id); if (!ownsOperation(lease)) return; await onApplicationChanged(); if (ownsOperation(lease)) await loadEntry(lease); }, true);
    if (type === "decline" && offer) void run("decline", async (lease) => { await declineOffer(offer.id); if (!ownsOperation(lease)) return; await synchronize(true, lease); if (ownsOperation(lease)) await onApplicationChanged(); }, true);
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

  return <Card><JourneyStageHeader title={offer ? copy.offerTitle : copy.title} description={offer ? copy.offerDescription : copy.description} icon={offer ? TicketCheck : ListOrdered} tone={offer ? "warning" : "default"} /><CardContent className="space-y-5 pt-5 sm:pt-6">
    {error ? <Alert variant="error" role="alert"><AlertTitle>{copy.title}</AlertTitle><AlertDescription className="space-y-3"><p>{error.message}</p><Button variant="outline" onClick={() => error.action === "signin" ? router.push(`/login?returnTo=/applications/${application.id}`) : error.action === "reload" ? window.location.reload() : refresh()}>{error.action === "signin" ? messages.common.logIn : messages.common.retry}</Button></AlertDescription></Alert> : null}
    {operation === "process" ? <p role="status">{copy.processing}</p> : null}
    {offer && activeEntry ? <TemporaryOfferView entry={activeEntry} rtoName={locale === "hi" ? activeEntry.rto.nameHi : activeEntry.rto.nameEn} date={formatAppointmentDate(offer.slot.date, locale)} timeLabel={copy.time} expiresAt={formatDateTime(offer.expiresAt, locale)} remaining={formatRemaining(remaining, locale)} expired={timing.acceptanceDisabled} busy={busy} operation={operation} copy={copy} onAccept={accept} onDecline={() => openConfirmation("decline")} onLeave={() => openConfirmation("leave")} /> : activeEntry ? <section className="space-y-4"><ActiveWaitlistSummary rtoName={locale === "hi" ? activeEntry.rto.nameHi : activeEntry.rto.nameEn} joinedAt={formatDateTime(activeEntry.joinedAt, locale)} copy={copy} /><WaitlistPreferencesForm copy={copy} locale={locale} preferences={preferences} rtos={rtos} busy={busy} onChange={setPreferences} onToggleBucket={toggleBucket} /><StageActionPanel><div className="flex flex-wrap gap-2"><Button disabled={busy || !valid} aria-busy={operation === "update"} onClick={submitUpdate}>{operation === "update" ? copy.updating : copy.update}</Button><Button variant="outline" disabled={busy} onClick={refresh}>{copy.refresh}</Button><Button variant="ghost" disabled={busy} onClick={() => openConfirmation("leave")}>{copy.leave}</Button></div></StageActionPanel></section> : <section className="space-y-4"><WaitlistPreferencesForm copy={copy} locale={locale} preferences={preferences} rtos={rtos} busy={busy} onChange={setPreferences} onToggleBucket={toggleBucket} /><StageActionPanel><Button disabled={busy || !valid} aria-busy={operation === "join"} onClick={submitJoin}>{operation === "join" ? copy.joining : copy.join}</Button></StageActionPanel></section>}
    {confirmation ? <ConfirmationDialog confirmation={confirmation} copy={copy} dialogRef={confirmationRef} onConfirm={completeConfirmation} onDismiss={dismissConfirmation} /> : null}
  </CardContent></Card>;
}
