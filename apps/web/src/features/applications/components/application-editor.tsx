"use client";

import {
  applicationSectionOrder,
  type ApplicationDetail,
  type ApplicationSectionKey,
} from "@raahsathi/contracts/applications";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { completeSection, saveSection } from "@/features/applications/api";
import type { Locale } from "@/i18n";

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

const districtLabels = {
  en: {
    CENTRAL: "Central Delhi",
    EAST: "East Delhi",
    NEW_DELHI: "New Delhi",
    NORTH: "North Delhi",
    NORTH_WEST: "North West Delhi",
    SOUTH: "South Delhi",
    SOUTH_WEST: "South West Delhi",
    WEST: "West Delhi",
  },
  hi: {
    CENTRAL: "मध्य दिल्ली",
    EAST: "पूर्वी दिल्ली",
    NEW_DELHI: "नई दिल्ली",
    NORTH: "उत्तरी दिल्ली",
    NORTH_WEST: "उत्तर पश्चिम दिल्ली",
    SOUTH: "दक्षिण दिल्ली",
    SOUTH_WEST: "दक्षिण पश्चिम दिल्ली",
    WEST: "पश्चिम दिल्ली",
  },
} as const;

const historyLabels: Readonly<Record<Locale, Readonly<Record<string, string>>>> = {
  en: {
    APPLICATION_CREATED: "Application started",
    SECTION_SAVED: "Section saved",
    SECTION_COMPLETED: "Section completed",
  },
  hi: {
    APPLICATION_CREATED: "आवेदन शुरू हुआ",
    SECTION_SAVED: "भाग सहेजा गया",
    SECTION_COMPLETED: "भाग पूरा हुआ",
  },
};

function sectionTitle(key: ApplicationSectionKey, messages: ApplicationCopy): string {
  return key === "PERSONAL_DETAILS" ? messages.personal : key === "ADDRESS" ? messages.address : key === "SERVICE_DETAILS" ? messages.service : messages.declaration;
}

function nextSection(application: ApplicationDetail): ApplicationSectionKey | undefined {
  return applicationSectionOrder.find((key) => !application.sections.find((section) => section.sectionKey === key)?.completed);
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
  const [notice, setNotice] = useState<Readonly<{ message: string; kind: "info" | "error" }>>();

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
      setNotice({
        message: action === "save" ? messages.saved : messages.completed,
        kind: "info",
      });
    } catch {
      setNotice({ message: messages.error, kind: "error" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><h1 className="text-3xl font-black leading-tight tracking-[-0.025em]">{messages.title}</h1></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm font-bold"><span id="application-progress-label">{messages.progress}</span><span>{application.progressPercent}%</span></div>
          <Progress value={application.progressPercent} label={messages.progress} />
        </CardContent>
      </Card>

      {currentKey ? (
        <Card>
          <CardHeader><CardTitle>{sectionTitle(currentKey, messages)}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {currentKey === "PERSONAL_DETAILS" ? <>
              <div className="space-y-2"><Label htmlFor="fullName">{messages.name}</Label><Input id="fullName" value={String(data.fullName ?? "")} onChange={(event) => setData({ ...data, fullName: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="dateOfBirth">{messages.dob}</Label><Input id="dateOfBirth" type="date" value={String(data.dateOfBirth ?? "")} onChange={(event) => setData({ ...data, dateOfBirth: event.target.value })} /></div>
            </> : null}
            {currentKey === "ADDRESS" ? <>
              <div className="space-y-2"><Label htmlFor="district">{messages.district}</Label><select id="district" className="min-h-11 w-full rounded-md border border-border-strong bg-card px-3 py-2 text-base leading-6" value={String(data.district ?? "CENTRAL")} onChange={(event) => setData({ ...data, district: event.target.value })}>{Object.entries(districtLabels[locale]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="postalCode">{messages.postal}</Label><Input id="postalCode" inputMode="numeric" value={String(data.postalCode ?? "")} onChange={(event) => setData({ ...data, district: data.district ?? "CENTRAL", postalCode: event.target.value })} /></div>
            </> : null}
            {currentKey === "SERVICE_DETAILS" ? <>
              <div className="space-y-2"><Label htmlFor="vehicleClass">{messages.vehicle}</Label><Input id="vehicleClass" value="LMV" readOnly /></div>
              {application.serviceKey === "PERMANENT_DRIVING_LICENCE" ? <div className="space-y-2"><Label htmlFor="learnerReference">{messages.learner}</Label><Input id="learnerReference" value={String(data.learnerLicenceReference ?? "")} onChange={(event) => setData({ vehicleClass: "LMV", learnerLicenceReference: event.target.value })} /></div> : null}
            </> : null}
            {currentKey === "DECLARATION" ? <label className="flex gap-3"><input type="checkbox" checked={data.accepted === true} onChange={(event) => setData({ accepted: event.target.checked })} /><span>{messages.accept}</span></label> : null}
            {notice ? <Alert variant={notice.kind} role="status"><AlertDescription>{notice.message}</AlertDescription></Alert> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" disabled={pending} onClick={() => run("save")}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{messages.save}</Button>
              <Button type="button" disabled={pending || !stored} onClick={() => run("complete")}>{messages.complete}</Button>
            </div>
          </CardContent>
        </Card>
      ) : <Card className="border-foreground"><CardContent className="space-y-3 py-6"><CheckCircle2 className="size-8 text-foreground" /><p className="font-bold leading-6">{messages.blocked}</p></CardContent></Card>}

      <Card><CardHeader><CardTitle>{messages.history}</CardTitle></CardHeader><CardContent><ol className="space-y-3">{application.history.map((event) => <li key={event.id} className="border-l-2 pl-3 text-sm leading-6"><strong>{historyLabels[locale][event.eventType] ?? event.eventType.replaceAll("_", " ")}</strong><br /><span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN")}</span></li>)}</ol></CardContent></Card>
    </div>
  );
}
