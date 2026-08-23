"use client";

import { applicationSectionOrder, type ApplicationDetail, type ApplicationSectionData, type ApplicationSectionKey } from "@raahsathi/contracts/applications";
import type { IdentityContext } from "@raahsathi/contracts/identity";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/shared/state-presentations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { completeSection, getApplication, saveSection } from "@/features/applications/api";
import { ApplicationSectionForm, type SectionSubmitAction } from "@/features/applications/components/application-section-form";
import { IdentityRecoveryPanel } from "@/features/identity/components/identity-recovery-panel";
import type { Locale, MessageDictionary } from "@/i18n";

const nextSection: Readonly<Partial<Record<ApplicationDetail["nextActionCode"], ApplicationSectionKey>>> = {
  COMPLETE_PERSONAL_DETAILS: "PERSONAL_DETAILS", COMPLETE_ADDRESS: "ADDRESS", COMPLETE_SERVICE_DETAILS: "SERVICE_DETAILS", COMPLETE_DECLARATION: "DECLARATION",
};

export function ApplicationEditor({ initialApplication, initialIdentity, locale, messages }: Readonly<{ initialApplication: ApplicationDetail; initialIdentity: IdentityContext; locale: Locale; messages: MessageDictionary }>) {
  const m = messages.applications;
  const [application, setApplication] = useState(initialApplication);
  const [notice, setNotice] = useState<string>();
  const currentKey = nextSection[application.nextActionCode];
  const stored = currentKey ? application.sections.find((section) => section.sectionKey === currentKey) : undefined;
  const sectionNames: Record<ApplicationSectionKey, string> = { PERSONAL_DETAILS: m.personalDetails, ADDRESS: m.address, SERVICE_DETAILS: m.serviceDetails, DECLARATION: m.declaration };
  const statuses = { DRAFT: m.statusDraft, IN_PROGRESS: m.statusInProgress, READY_FOR_IDENTITY: m.statusReadyForIdentity, READY_FOR_PAYMENT: m.statusReadyForPayment };
  const actions = { COMPLETE_PERSONAL_DETAILS: m.nextPersonalDetails, COMPLETE_ADDRESS: m.nextAddress, COMPLETE_SERVICE_DETAILS: m.nextServiceDetails, COMPLETE_DECLARATION: m.nextDeclaration, VERIFY_IDENTITY: m.nextIdentity, PAY_FEES: m.nextPayment };
  const blocking = application.blockingReasonCode === "IDENTITY_VERIFICATION_REQUIRED" ? m.blockingIdentity : application.blockingReasonCode === "PAYMENT_REQUIRED" ? m.blockingPayment : undefined;
  const historyLabels = { APPLICATION_CREATED: m.historyApplicationCreated, SECTION_SAVED: m.historySectionSaved, SECTION_COMPLETED: m.historySectionCompleted, WORKFLOW_ADVANCED: m.historyWorkflowAdvanced, IDENTITY_STARTED: m.historyIdentityStarted, IDENTITY_RETRY_STARTED: m.historyIdentityRetryStarted, IDENTITY_VERIFIED: m.historyIdentityVerified };
  const persist = async (data: ApplicationSectionData, action: SectionSubmitAction, dirty: boolean) => {
    if (!currentKey) return;
    let updated = application;
    if (dirty || !stored) updated = await saveSection({ applicationId: application.id, sectionKey: currentKey, expectedRevision: stored?.revision ?? 0, data });
    if (action === "complete") updated = await completeSection(application.id, currentKey);
    setApplication(updated); setNotice(action === "save" ? m.saved : m.completed);
  };
  const refresh = async () => setApplication(await getApplication(application.id));

  return <div className="space-y-6">
    <Card><CardHeader><p className="text-sm font-bold uppercase tracking-widest">{m.eyebrow}</p><h1 className="text-3xl font-black">{m.detailTitle}</h1><p className="text-muted-foreground">{m.detailDescription}</p></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div><p className="text-sm text-muted-foreground">{m.statusLabel}</p><StatusBadge tone="neutral">{statuses[application.statusCode]}</StatusBadge></div>
      <div><p className="text-sm text-muted-foreground">{m.updatedLabel}</p><p className="font-bold">{new Date(application.updatedAt).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN")}</p></div>
      <div className="sm:col-span-2"><div className="mb-2 flex justify-between font-bold"><span>{m.progressLabel}</span><span>{application.progressPercent}%</span></div><Progress value={application.progressPercent} label={m.progressLabel} /></div>
      <div className="sm:col-span-2"><p className="text-sm text-muted-foreground">{m.nextActionLabel}</p><p className="font-bold">{actions[application.nextActionCode]}</p></div>
      {blocking ? <Alert className="sm:col-span-2"><AlertTitle>{m.blockingTitle}</AlertTitle><AlertDescription>{blocking}</AlertDescription></Alert> : null}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{m.sectionsTitle}</CardTitle></CardHeader><CardContent><ol className="grid gap-3 sm:grid-cols-2">{applicationSectionOrder.map((key) => { const completed = application.sections.some((section) => section.sectionKey === key && section.completed); const state = completed ? m.completedSection : key === currentKey ? m.currentSection : m.upcomingSection; return <li key={key} className="rounded-xl border p-4"><p className="font-bold">{sectionNames[key]}</p><p className="text-sm text-muted-foreground">{state}</p></li>; })}</ol></CardContent></Card>
    {currentKey ? <Card><CardHeader><CardTitle>{sectionNames[currentKey]}</CardTitle></CardHeader><CardContent className="space-y-4">{notice ? <Alert role="status"><AlertDescription>{notice}</AlertDescription></Alert> : null}<ApplicationSectionForm key={`${currentKey}-${stored?.revision ?? 0}`} applicationId={application.id} sectionKey={currentKey} serviceKey={application.serviceKey} initialData={stored?.data} locale={locale} messages={messages} onPersist={persist} /></CardContent></Card> : <Alert><CheckCircle2 className="size-5" aria-hidden="true" /><AlertDescription>{m.allSectionsComplete}</AlertDescription></Alert>}
    {application.progressPercent === 100 ? <IdentityRecoveryPanel applicationId={application.id} initialContext={initialIdentity} locale={locale} messages={messages} onApplicationChanged={refresh} /> : null}
    {application.statusCode === "READY_FOR_PAYMENT" ? <Alert><AlertTitle>{m.paymentUnavailableTitle}</AlertTitle><AlertDescription>{m.paymentUnavailableDescription}</AlertDescription></Alert> : null}
    <Card><CardHeader><CardTitle>{m.historyTitle}</CardTitle></CardHeader><CardContent>{application.history.length ? <ol className="space-y-3">{application.history.slice(-6).reverse().map((event) => <li key={event.id} className="border-l-2 pl-3 text-sm"><strong>{historyLabels[event.eventType] ?? m.historyGeneric}</strong>{event.sectionKey ? ` — ${sectionNames[event.sectionKey]}` : ""}<br/><span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN")}</span></li>)}</ol> : <p>{m.historyEmpty}</p>}</CardContent></Card>
  </div>;
}
