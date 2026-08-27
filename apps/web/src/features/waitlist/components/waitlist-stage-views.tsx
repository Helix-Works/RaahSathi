import type { Rto } from "@raahsathi/contracts/appointments";
import type { WaitlistEntry, WaitlistPreferences, WaitlistTimeBucket } from "@raahsathi/contracts/waitlist";
import { Clock3, ListOrdered, TicketCheck } from "lucide-react";

import { DefinitionGrid, DefinitionItem, StageActionPanel } from "@/components/shared/journey-stage";
import { IconTile } from "@/components/shared/icon-tile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale, MessageDictionary } from "@/i18n";

export function WaitlistPreferencesForm({ copy, locale, preferences, rtos, busy, onChange, onToggleBucket }: Readonly<{
  copy: MessageDictionary["waitlist"];
  locale: Locale;
  preferences: WaitlistPreferences;
  rtos: readonly Rto[];
  busy: boolean;
  onChange: (value: WaitlistPreferences) => void;
  onToggleBucket: (value: WaitlistTimeBucket) => void;
}>) {
  return <div className="grid gap-4 rounded-panel border border-border bg-surface-muted p-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label htmlFor="waitlist-rto">{copy.rto}</Label><select id="waitlist-rto" className="mt-1 min-h-11 w-full rounded-control border border-input bg-card px-3 text-base shadow-none outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70" disabled={busy} value={preferences.rtoId} onChange={(event) => onChange({ ...preferences, rtoId: event.target.value })}><option value="">{copy.chooseRto}</option>{rtos.filter((rto) => rto.status === "AVAILABLE").map((rto) => <option key={rto.id} value={rto.id}>{locale === "hi" ? rto.nameHi : rto.nameEn}</option>)}</select></div><div><Label htmlFor="waitlist-from">{copy.dateFrom}</Label><Input id="waitlist-from" type="date" disabled={busy} value={preferences.acceptableDateFrom} onChange={(event) => onChange({ ...preferences, acceptableDateFrom: event.target.value })} /></div><div><Label htmlFor="waitlist-to">{copy.dateTo}</Label><Input id="waitlist-to" type="date" min={preferences.acceptableDateFrom} disabled={busy} value={preferences.acceptableDateTo} onChange={(event) => onChange({ ...preferences, acceptableDateTo: event.target.value })} /></div><fieldset className="sm:col-span-2"><legend className="text-sm font-bold">{copy.buckets}</legend><div className="mt-2 flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm font-medium"><input className="size-4 accent-primary" type="checkbox" checked={preferences.timeBuckets.includes("MORNING")} disabled={busy} onChange={() => onToggleBucket("MORNING")} />{copy.morning}</label><label className="flex items-center gap-2 text-sm font-medium"><input className="size-4 accent-primary" type="checkbox" checked={preferences.timeBuckets.includes("AFTERNOON")} disabled={busy} onChange={() => onToggleBucket("AFTERNOON")} />{copy.afternoon}</label></div></fieldset><div><Label>{copy.vehicleClass}</Label><p className="mt-1 min-h-11 rounded-control border border-border bg-card px-3 py-2 font-semibold">LMV</p></div></div>;
}

export function ActiveWaitlistSummary({ rtoName, joinedAt, copy }: Readonly<{
  rtoName: string;
  joinedAt: string;
  copy: MessageDictionary["waitlist"];
}>) {
  return <section className="space-y-4" aria-labelledby="active-waitlist-title"><Alert variant="info" role="status" className="flex items-start gap-3"><IconTile size="sm"><ListOrdered aria-hidden="true" /></IconTile><div className="space-y-1"><AlertTitle id="active-waitlist-title">{copy.waiting}</AlertTitle><AlertDescription>{copy.fifo}</AlertDescription></div></Alert><DefinitionGrid><DefinitionItem label={copy.rto}>{rtoName}</DefinitionItem><DefinitionItem label={copy.joined}>{joinedAt}</DefinitionItem></DefinitionGrid></section>;
}

export function OfferCountdown({ expired, remaining, expiresAt, copy }: Readonly<{
  expired: boolean;
  remaining: string;
  expiresAt: string;
  copy: MessageDictionary["waitlist"];
}>) {
  return <Alert variant={expired ? "warning" : "info"} role={expired ? "status" : undefined} aria-live={expired ? "polite" : undefined} className="flex items-start gap-3"><IconTile size="sm" tone={expired ? "warning" : "default"}><Clock3 aria-hidden="true" /></IconTile><div className="space-y-1"><AlertTitle>{expired ? copy.offerExpired : `${copy.remaining}: ${remaining}`}</AlertTitle><AlertDescription>{copy.expires}: {expiresAt}</AlertDescription><span className="sr-only">{expired ? copy.offerExpired : `${copy.expires}: ${expiresAt}`}</span></div></Alert>;
}

export function TemporaryOfferView({
  entry,
  rtoName,
  date,
  timeLabel,
  expiresAt,
  remaining,
  expired,
  busy,
  operation,
  copy,
  onAccept,
  onDecline,
  onLeave,
}: Readonly<{
  entry: WaitlistEntry;
  rtoName: string;
  date: string;
  timeLabel: string;
  expiresAt: string;
  remaining: string;
  expired: boolean;
  busy: boolean;
  operation?: string;
  copy: MessageDictionary["waitlist"];
  onAccept: () => void;
  onDecline: () => void;
  onLeave: () => void;
}>) {
  const offer = entry.offer;
  if (!offer) return null;
  return <section className="space-y-4" aria-labelledby="slot-offer-details"><div className="flex items-start gap-3"><IconTile tone="warning"><TicketCheck aria-hidden="true" /></IconTile><h3 id="slot-offer-details" className="pt-2 text-lg font-bold">{copy.offerTitle}</h3></div><DefinitionGrid><DefinitionItem label={copy.rto}>{rtoName}</DefinitionItem><DefinitionItem label={copy.dateFrom}>{date}</DefinitionItem><DefinitionItem label={timeLabel}>{offer.slot.startTime}–{offer.slot.endTime}</DefinitionItem><DefinitionItem label={copy.expires}>{expiresAt}</DefinitionItem></DefinitionGrid><OfferCountdown expired={expired} remaining={remaining} expiresAt={expiresAt} copy={copy} /><StageActionPanel><div className="flex flex-wrap gap-2"><Button disabled={busy || expired} aria-busy={operation === "accept"} onClick={onAccept}>{operation === "accept" ? copy.accepting : copy.accept}</Button><Button variant="outline" disabled={busy} aria-busy={operation === "decline"} onClick={onDecline}>{operation === "decline" ? copy.declining : copy.decline}</Button><Button variant="ghost" disabled={busy} onClick={onLeave}>{copy.leave}</Button></div></StageActionPanel></section>;
}
