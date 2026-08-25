"use client";

import {
  applicationSectionOrder,
  type ApplicationDetail,
  type ApplicationSectionData,
  type ApplicationSectionKey,
} from "@raahsathi/contracts/applications";
import type { IdentityContext } from "@raahsathi/contracts/identity";
import type { PaymentContext } from "@raahsathi/contracts/payments";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/shared/state-presentations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { completeSection, getApplication, saveSection } from "@/features/applications/api";
import {
  ApplicationSectionForm,
  type SectionSubmitAction,
} from "@/features/applications/components/application-section-form";
import { IdentityRecoveryPanel } from "@/features/identity/components/identity-recovery-panel";
import { AppointmentPanel } from "@/features/appointments/components/appointment-panel";
import { PaymentPanel } from "@/features/payments/components/payment-panel";
import { isPaymentRelevantApplicationStatus } from "@/features/payments/payment-flow";
import type { Locale, MessageDictionary } from "@/i18n";

type ApplicationMessages = MessageDictionary["applications"];
type SectionNames = Readonly<Record<ApplicationSectionKey, string>>;

const nextSection: Readonly<Partial<Record<ApplicationDetail["nextActionCode"], ApplicationSectionKey>>> = {
  COMPLETE_PERSONAL_DETAILS: "PERSONAL_DETAILS",
  COMPLETE_ADDRESS: "ADDRESS",
  COMPLETE_SERVICE_DETAILS: "SERVICE_DETAILS",
  COMPLETE_DECLARATION: "DECLARATION",
};

function formatDelhiDate(value: string, locale: Locale): string {
  return new Date(value).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", {
    timeZone: "Asia/Kolkata",
  });
}

function ApplicationStatusCard({
  application,
  locale,
  messages,
}: Readonly<{
  application: ApplicationDetail;
  locale: Locale;
  messages: ApplicationMessages;
}>) {
  const statuses = {
    DRAFT: messages.statusDraft,
    IN_PROGRESS: messages.statusInProgress,
    READY_FOR_IDENTITY: messages.statusReadyForIdentity,
    READY_FOR_PAYMENT: messages.statusReadyForPayment,
    READY_FOR_APPOINTMENT: messages.statusReadyForAppointment,
    WAITLISTED: messages.statusWaitlisted,
    SLOT_OFFERED: messages.statusSlotOffered,
    APPOINTMENT_BOOKED: messages.statusAppointmentBooked,
  };
  const actions = {
    COMPLETE_PERSONAL_DETAILS: messages.nextPersonalDetails,
    COMPLETE_ADDRESS: messages.nextAddress,
    COMPLETE_SERVICE_DETAILS: messages.nextServiceDetails,
    COMPLETE_DECLARATION: messages.nextDeclaration,
    VERIFY_IDENTITY: messages.nextIdentity,
    PAY_FEES: messages.nextPayment,
    SELECT_APPOINTMENT: messages.nextAppointment,
    REVIEW_WAITLIST: messages.nextReviewWaitlist,
    REVIEW_OFFER: messages.nextReviewOffer,
    REVIEW_APPOINTMENT: messages.nextReviewAppointment,
    NONE: messages.nextActionNone,
  };
  const blocking = application.blockingReasonCode === "IDENTITY_VERIFICATION_REQUIRED"
    ? messages.blockingIdentity
    : application.blockingReasonCode === "PAYMENT_REQUIRED"
      ? messages.blockingPayment
      : undefined;

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-bold uppercase tracking-widest">{messages.eyebrow}</p>
        <h1 className="text-3xl font-black">{messages.detailTitle}</h1>
        <p className="text-muted-foreground">{messages.detailDescription}</p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">{messages.statusLabel}</p>
          <StatusBadge tone="neutral">{statuses[application.statusCode]}</StatusBadge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{messages.updatedLabel}</p>
          <p className="font-bold">{formatDelhiDate(application.updatedAt, locale)}</p>
        </div>
        <div className="sm:col-span-2">
          <div className="mb-2 flex justify-between font-bold">
            <span>{messages.progressLabel}</span>
            <span>{application.progressPercent}%</span>
          </div>
          <Progress value={application.progressPercent} label={messages.progressLabel} />
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm text-muted-foreground">{messages.nextActionLabel}</p>
          <p className="font-bold">{actions[application.nextActionCode]}</p>
        </div>
        {blocking ? (
          <Alert className="sm:col-span-2">
            <AlertTitle>{messages.blockingTitle}</AlertTitle>
            <AlertDescription>{blocking}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ApplicationSectionsCard({
  application,
  currentKey,
  messages,
  sectionNames,
}: Readonly<{
  application: ApplicationDetail;
  currentKey?: ApplicationSectionKey;
  messages: ApplicationMessages;
  sectionNames: SectionNames;
}>) {
  return (
    <Card>
      <CardHeader><CardTitle>{messages.sectionsTitle}</CardTitle></CardHeader>
      <CardContent>
        <ol className="grid gap-3 sm:grid-cols-2">
          {applicationSectionOrder.map((key) => {
            const completed = application.sections.some(
              (section) => section.sectionKey === key && section.completed,
            );
            const state = completed
              ? messages.completedSection
              : key === currentKey
                ? messages.currentSection
                : messages.upcomingSection;

            return (
              <li key={key} className="rounded-xl border p-4">
                <p className="font-bold">{sectionNames[key]}</p>
                <p className="text-sm text-muted-foreground">{state}</p>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function ApplicationHistoryCard({
  application,
  locale,
  messages,
  sectionNames,
}: Readonly<{
  application: ApplicationDetail;
  locale: Locale;
  messages: ApplicationMessages;
  sectionNames: SectionNames;
}>) {
  const historyLabels: Readonly<Record<ApplicationDetail["history"][number]["eventType"], string>> = {
    APPLICATION_CREATED: messages.historyApplicationCreated,
    SECTION_SAVED: messages.historySectionSaved,
    SECTION_COMPLETED: messages.historySectionCompleted,
    WORKFLOW_ADVANCED: messages.historyWorkflowAdvanced,
    IDENTITY_STARTED: messages.historyIdentityStarted,
    IDENTITY_RETRY_STARTED: messages.historyIdentityRetryStarted,
    IDENTITY_VERIFIED: messages.historyIdentityVerified,
    PAYMENT_STARTED: messages.historyPaymentStarted,
    PAYMENT_FAILED: messages.historyPaymentFailed,
    PAYMENT_SUCCEEDED: messages.historyPaymentSucceeded,
    APPOINTMENT_BOOKED: messages.historyAppointmentBooked,
    APPOINTMENT_CANCELLED: messages.historyAppointmentCancelled,
    WAITLIST_JOINED: messages.historyWaitlistJoined,
    WAITLIST_UPDATED: messages.historyWaitlistUpdated,
    WAITLIST_LEFT: messages.historyWaitlistLeft,
    SLOT_OFFER_CREATED: messages.historyOfferCreated,
    SLOT_OFFER_ACCEPTED: messages.historyOfferAccepted,
    SLOT_OFFER_DECLINED: messages.historyOfferDeclined,
    SLOT_OFFER_EXPIRED: messages.historyOfferExpired,
  };

  return (
    <Card>
      <CardHeader><CardTitle>{messages.historyTitle}</CardTitle></CardHeader>
      <CardContent>
        {application.history.length ? (
          <ol className="space-y-3">
            {application.history.slice(-6).reverse().map((event) => (
              <li key={event.id} className="border-l-2 pl-3 text-sm">
                <strong>{historyLabels[event.eventType] ?? messages.historyGeneric}</strong>
                {event.sectionKey ? ` — ${sectionNames[event.sectionKey]}` : ""}
                <br />
                <span className="text-muted-foreground">
                  {formatDelhiDate(event.createdAt, locale)}
                </span>
              </li>
            ))}
          </ol>
        ) : <p>{messages.historyEmpty}</p>}
      </CardContent>
    </Card>
  );
}

export function ApplicationEditor({
  initialApplication,
  initialIdentity,
  initialPayment,
  locale,
  messages,
}: Readonly<{
  initialApplication: ApplicationDetail;
  initialIdentity: IdentityContext;
  initialPayment: PaymentContext;
  locale: Locale;
  messages: MessageDictionary;
}>) {
  const applicationMessages = messages.applications;
  const [application, setApplication] = useState(initialApplication);
  const [notice, setNotice] = useState<string>();
  const currentKey = nextSection[application.nextActionCode];
  const stored = currentKey
    ? application.sections.find((section) => section.sectionKey === currentKey)
    : undefined;
  const sectionNames: SectionNames = {
    PERSONAL_DETAILS: applicationMessages.personalDetails,
    ADDRESS: applicationMessages.address,
    SERVICE_DETAILS: applicationMessages.serviceDetails,
    DECLARATION: applicationMessages.declaration,
  };

  const persist = async (
    data: ApplicationSectionData,
    action: SectionSubmitAction,
    dirty: boolean,
  ) => {
    if (!currentKey) return;
    let updated = application;
    if (dirty || !stored) {
      updated = await saveSection({
        applicationId: application.id,
        sectionKey: currentKey,
        expectedRevision: stored?.revision ?? 0,
        data,
      });
    }
    if (action === "complete") updated = await completeSection(application.id, currentKey);
    setApplication(updated);
    setNotice(action === "save" ? applicationMessages.saved : applicationMessages.completed);
  };
  const refresh = async () => setApplication(await getApplication(application.id));

  return (
    <div className="space-y-6">
      <ApplicationStatusCard application={application} locale={locale} messages={applicationMessages} />
      <ApplicationSectionsCard
        application={application}
        currentKey={currentKey}
        messages={applicationMessages}
        sectionNames={sectionNames}
      />

      {currentKey ? (
        <Card>
          <CardHeader><CardTitle>{sectionNames[currentKey]}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {notice ? <Alert role="status"><AlertDescription>{notice}</AlertDescription></Alert> : null}
            <ApplicationSectionForm
              key={`${currentKey}-${stored?.revision ?? 0}`}
              applicationId={application.id}
              sectionKey={currentKey}
              serviceKey={application.serviceKey}
              initialData={stored?.data}
              locale={locale}
              messages={messages}
              onPersist={persist}
            />
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <CheckCircle2 className="size-5" aria-hidden="true" />
          <AlertDescription>{applicationMessages.allSectionsComplete}</AlertDescription>
        </Alert>
      )}

      {application.progressPercent === 100 ? (
        <IdentityRecoveryPanel
          applicationId={application.id}
          initialContext={initialIdentity}
          messages={messages}
          onApplicationChanged={refresh}
        />
      ) : null}

      {isPaymentRelevantApplicationStatus(application.statusCode) ? (
        <PaymentPanel
          initialContext={initialPayment}
          locale={locale}
          messages={messages.payments}
          onApplicationChanged={refresh}
        />
      ) : null}

      <AppointmentPanel application={application} locale={locale} onApplicationChanged={refresh} />

      <ApplicationHistoryCard
        application={application}
        locale={locale}
        messages={applicationMessages}
        sectionNames={sectionNames}
      />
    </div>
  );
}
