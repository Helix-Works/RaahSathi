"use client";

import {
  applicationSectionOrder,
  type ApplicationDetail,
  type ApplicationSectionData,
  type ApplicationSectionKey,
} from "@raahsathi/contracts/applications";
import type { Appointment } from "@raahsathi/contracts/appointments";
import type { IdentityContext } from "@raahsathi/contracts/identity";
import type { PaymentContext } from "@raahsathi/contracts/payments";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApplicationCurrentSection } from "@/features/applications/components/application-current-section";
import { ApplicationHistory } from "@/features/applications/components/application-history";
import { ApplicationOverview } from "@/features/applications/components/application-overview";
import { ApplicationSectionForm, type SectionSubmitAction } from "@/features/applications/components/application-section-form";
import { ApplicationStepper } from "@/features/applications/components/application-stepper";
import { completeSection, getApplication, saveSection } from "@/features/applications/api";
import { applicationBlockingReasonMessage } from "@/features/applications/status-presentation";
import { AppointmentPanel } from "@/features/appointments/components/appointment-panel";
import { IdentityRecoveryPanel } from "@/features/identity/components/identity-recovery-panel";
import { PaymentPanel } from "@/features/payments/components/payment-panel";
import { isPaymentRelevantApplicationStatus } from "@/features/payments/payment-flow";
import { getServiceCopy } from "@/features/services/presentation";
import { WaitlistPanel } from "@/features/waitlist/components/waitlist-panel";
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

function serviceName(application: ApplicationDetail, messages: MessageDictionary): string {
  return getServiceCopy(application.serviceKey, messages.services).name;
}

function statusLabel(application: ApplicationDetail, messages: ApplicationMessages): string {
  const statuses: Readonly<Record<ApplicationDetail["statusCode"], string>> = {
    DRAFT: messages.statusDraft,
    IN_PROGRESS: messages.statusInProgress,
    READY_FOR_IDENTITY: messages.statusReadyForIdentity,
    READY_FOR_PAYMENT: messages.statusReadyForPayment,
    READY_FOR_APPOINTMENT: messages.statusReadyForAppointment,
    WAITLISTED: messages.statusWaitlisted,
    SLOT_OFFERED: messages.statusSlotOffered,
    APPOINTMENT_BOOKED: messages.statusAppointmentBooked,
    COMPLETED: messages.statusCompleted,
  };
  return statuses[application.statusCode];
}

function nextActionLabel(application: ApplicationDetail, messages: ApplicationMessages): string {
  const actions: Readonly<Record<ApplicationDetail["nextActionCode"], string>> = {
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
    REVIEW_COMPLETION: messages.nextReviewCompletion,
    NONE: messages.nextActionNone,
  };
  return actions[application.nextActionCode];
}

function historyItems(application: ApplicationDetail, locale: Locale, messages: ApplicationMessages, sectionNames: SectionNames) {
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
    SERVICE_COMPLETED: messages.historyServiceCompleted,
  };

  return application.history.slice(-6).reverse().map((event) => ({
    id: event.id,
    label: historyLabels[event.eventType] ?? messages.historyGeneric,
    sectionName: event.sectionKey ? sectionNames[event.sectionKey] : undefined,
    timestamp: formatDelhiDate(event.createdAt, locale),
  }));
}

export function ApplicationEditor({
  initialApplication,
  initialIdentity,
  initialPayment,
  initialAppointment,
  locale,
  messages,
}: Readonly<{
  initialApplication: ApplicationDetail;
  initialIdentity: IdentityContext;
  initialPayment: PaymentContext;
  initialAppointment?: Appointment;
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

  const persist = async (data: ApplicationSectionData, action: SectionSubmitAction, dirty: boolean) => {
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
  const blocking = application.blockingReasonCode
    ? { title: applicationMessages.blockingTitle, description: applicationBlockingReasonMessage(application.blockingReasonCode, applicationMessages) }
    : undefined;

  return (
    <div className="space-y-6">
      <ApplicationOverview
        eyebrow={applicationMessages.eyebrow}
        title={applicationMessages.detailTitle}
        description={applicationMessages.detailDescription}
        serviceLabel={applicationMessages.serviceLabel}
        serviceName={serviceName(application, messages)}
        statusLabel={applicationMessages.statusLabel}
        status={statusLabel(application, applicationMessages)}
        updatedLabel={applicationMessages.updatedLabel}
        updatedValue={formatDelhiDate(application.updatedAt, locale)}
        nextActionLabel={applicationMessages.nextActionLabel}
        nextAction={nextActionLabel(application, applicationMessages)}
        blocking={blocking}
      />
      <ApplicationStepper
        title={applicationMessages.sectionsTitle}
        steps={applicationSectionOrder.map((key) => {
          const completed = application.sections.some((section) => section.sectionKey === key && section.completed);
          const state = completed ? "completed" : key === currentKey ? "current" : "upcoming";
          return {
            key,
            name: sectionNames[key],
            state,
            stateLabel: state === "completed" ? applicationMessages.completedSection : state === "current" ? applicationMessages.currentSection : applicationMessages.upcomingSection,
          };
        })}
      />

      {currentKey ? (
        <ApplicationCurrentSection eyebrow={applicationMessages.formTitle} title={sectionNames[currentKey]}>
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
        </ApplicationCurrentSection>
      ) : application.statusCode === "READY_FOR_IDENTITY" ? (
        <Alert><CheckCircle2 className="size-5" aria-hidden="true" /><AlertDescription>{applicationMessages.allSectionsComplete}</AlertDescription></Alert>
      ) : null}

      {application.progressPercent === 100 ? <IdentityRecoveryPanel applicationId={application.id} initialContext={initialIdentity} messages={messages} onApplicationChanged={refresh} /> : null}
      {isPaymentRelevantApplicationStatus(application.statusCode) ? <PaymentPanel initialContext={initialPayment} locale={locale} messages={messages.payments} onApplicationChanged={refresh} /> : null}
      <AppointmentPanel application={application} initialAppointment={initialAppointment} locale={locale} messages={messages.appointments} onApplicationChanged={refresh} />
      <WaitlistPanel application={application} locale={locale} messages={messages} onApplicationChanged={refresh} />
      <ApplicationHistory title={applicationMessages.historyTitle} emptyLabel={applicationMessages.historyEmpty} items={historyItems(application, locale, applicationMessages, sectionNames)} />
    </div>
  );
}
