"use client";

import type { ApplicationDetail, ApplicationSectionKey } from "@raahsathi/contracts/applications";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeSection, saveSection } from "@/features/applications/api";
import type { Locale } from "@/i18n";

const order: readonly ApplicationSectionKey[] = ["PERSONAL_DETAILS", "ADDRESS", "SERVICE_DETAILS", "DECLARATION"];
const copy = {
  en: {
    title: "Durable application", saved: "Draft saved in PostgreSQL.", save: "Save draft", complete: "Complete saved section",
    progress: "Application progress", history: "Application history", personal: "Personal details", address: "Delhi address",
    service: "Service details", declaration: "Declaration", name: "Synthetic full name", dob: "Synthetic date of birth",
    district: "Delhi district", postal: "Synthetic postal code", vehicle: "Vehicle class", learner: "Synthetic learner licence reference",
    accept: "I confirm this application uses synthetic data only.", error: "The change was not saved. Reload if another page updated this application.",
    blocked: "Identity verification is the next step and will be connected in Phase 3.", completed: "Completed",
  },
  hi: {
    title: "स्थायी आवेदन", saved: "ड्राफ्ट PostgreSQL में सहेजा गया।", save: "ड्राफ्ट सहेजें", complete: "सहेजा हुआ भाग पूरा करें",
    progress: "आवेदन की प्रगति", history: "आवेदन का इतिहास", personal: "व्यक्तिगत विवरण", address: "दिल्ली का पता",
    service: "सेवा विवरण", declaration: "घोषणा", name: "कृत्रिम पूरा नाम", dob: "कृत्रिम जन्मतिथि",
    district: "दिल्ली जिला", postal: "कृत्रिम पिन कोड", vehicle: "वाहन वर्ग", learner: "कृत्रिम लर्नर लाइसेंस संदर्भ",
    accept: "मैं पुष्टि करता/करती हूँ कि यह आवेदन केवल कृत्रिम डेटा का उपयोग करता है।", error: "बदलाव सहेजा नहीं गया। यदि किसी अन्य पेज ने आवेदन बदला है तो फिर लोड करें।",
    blocked: "पहचान सत्यापन अगला चरण है और इसे चरण 3 में जोड़ा जाएगा।", completed: "पूरा",
  },
} as const;

type ApplicationCopy = { [Key in keyof typeof copy.en]: string };

function sectionTitle(key: ApplicationSectionKey, messages: ApplicationCopy): string {
  return key === "PERSONAL_DETAILS" ? messages.personal : key === "ADDRESS" ? messages.address : key === "SERVICE_DETAILS" ? messages.service : messages.declaration;
}

function nextSection(application: ApplicationDetail): ApplicationSectionKey | undefined {
  return order.find((key) => !application.sections.find((section) => section.sectionKey === key)?.completed);
}

function draftFor(application: ApplicationDetail, key: ApplicationSectionKey | undefined): Record<string, unknown> {
  if (!key) return {};
  const stored = application.sections.find((section) => section.sectionKey === key);
  if (stored) return stored.data as Record<string, unknown>;
  if (key === "ADDRESS") return { district: "CENTRAL" };
  if (key === "SERVICE_DETAILS") return { vehicleClass: "LMV" };
  return {};
}

export function ApplicationEditor({ initialApplication, locale }: Readonly<{ initialApplication: ApplicationDetail; locale: Locale }>) {
  const messages = copy[locale];
  const [application, setApplication] = useState(initialApplication);
  const currentKey = nextSection(application);
  const stored = currentKey ? application.sections.find((section) => section.sectionKey === currentKey) : undefined;
  const [data, setData] = useState<Record<string, unknown>>(() => draftFor(initialApplication, nextSection(initialApplication)));
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string>();

  const run = async (action: "save" | "complete") => {
    if (!currentKey) return;
    setPending(true);
    setNotice(undefined);
    try {
      const updated = action === "save"
        ? await saveSection({ applicationId: application.id, sectionKey: currentKey, expectedRevision: stored?.revision ?? 0, data })
        : await completeSection(application.id, currentKey);
      setApplication(updated);
      setData(draftFor(updated, nextSection(updated)));
      setNotice(action === "save" ? messages.saved : messages.completed);
    } catch {
      setNotice(messages.error);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><h1 className="text-3xl font-black">{messages.title}</h1></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm font-bold"><span>{messages.progress}</span><span>{application.progressPercent}%</span></div>
          <div className="h-2 rounded-full bg-muted" role="progressbar" aria-valuenow={application.progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${application.progressPercent}%` }} />
          </div>
        </CardContent>
      </Card>

      {currentKey ? (
        <Card>
          <CardHeader><h2 className="text-2xl font-black">{sectionTitle(currentKey, messages)}</h2></CardHeader>
          <CardContent className="space-y-5">
            {currentKey === "PERSONAL_DETAILS" ? <>
              <div className="space-y-2"><Label htmlFor="fullName">{messages.name}</Label><Input id="fullName" value={String(data.fullName ?? "")} onChange={(event) => setData({ ...data, fullName: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="dateOfBirth">{messages.dob}</Label><Input id="dateOfBirth" type="date" value={String(data.dateOfBirth ?? "")} onChange={(event) => setData({ ...data, dateOfBirth: event.target.value })} /></div>
            </> : null}
            {currentKey === "ADDRESS" ? <>
              <div className="space-y-2"><Label htmlFor="district">{messages.district}</Label><select id="district" className="h-11 w-full rounded-md border bg-background px-3" value={String(data.district ?? "CENTRAL")} onChange={(event) => setData({ ...data, district: event.target.value })}><option value="CENTRAL">Central Delhi</option><option value="EAST">East Delhi</option><option value="NEW_DELHI">New Delhi</option><option value="NORTH">North Delhi</option><option value="NORTH_WEST">North West Delhi</option><option value="SOUTH">South Delhi</option><option value="SOUTH_WEST">South West Delhi</option><option value="WEST">West Delhi</option></select></div>
              <div className="space-y-2"><Label htmlFor="postalCode">{messages.postal}</Label><Input id="postalCode" inputMode="numeric" value={String(data.postalCode ?? "")} onChange={(event) => setData({ ...data, district: data.district ?? "CENTRAL", postalCode: event.target.value })} /></div>
            </> : null}
            {currentKey === "SERVICE_DETAILS" ? <>
              <div className="space-y-2"><Label htmlFor="vehicleClass">{messages.vehicle}</Label><Input id="vehicleClass" value="LMV" readOnly /></div>
              {application.serviceKey === "PERMANENT_DRIVING_LICENCE" ? <div className="space-y-2"><Label htmlFor="learnerReference">{messages.learner}</Label><Input id="learnerReference" value={String(data.learnerLicenceReference ?? "")} onChange={(event) => setData({ vehicleClass: "LMV", learnerLicenceReference: event.target.value })} /></div> : null}
            </> : null}
            {currentKey === "DECLARATION" ? <label className="flex gap-3"><input type="checkbox" checked={data.accepted === true} onChange={(event) => setData({ accepted: event.target.checked })} /><span>{messages.accept}</span></label> : null}
            {notice ? <p role="status" className="text-sm font-semibold">{notice}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" disabled={pending} onClick={() => run("save")}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{messages.save}</Button>
              <Button type="button" disabled={pending || !stored} onClick={() => run("complete")}>{messages.complete}</Button>
            </div>
          </CardContent>
        </Card>
      ) : <Card><CardContent className="space-y-3 py-6"><CheckCircle2 className="size-8 text-success" /><p className="font-bold">{messages.blocked}</p></CardContent></Card>}

      <Card><CardHeader><h2 className="text-xl font-black">{messages.history}</h2></CardHeader><CardContent><ol className="space-y-2">{application.history.map((event) => <li key={event.id} className="border-l-2 pl-3 text-sm"><strong>{event.eventType.replaceAll("_", " ")}</strong><br /><span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN")}</span></li>)}</ol></CardContent></Card>
    </div>
  );
}
