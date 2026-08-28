import type {
  ApplicationBlockingReasonCode,
  ApplicationNextActionCode,
  ApplicationStatusCode,
  ServiceKey,
} from "@raahsathi/contracts/applications";
import { CalendarClock, Clock3, IdCard, TicketCheck } from "lucide-react";
import Link from "next/link";

import { BlockingReasonAlert } from "@/components/shared/blocking-reason-alert";
import { IconTile } from "@/components/shared/icon-tile";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { NextActionCard, EmptyState, StatusBadge } from "@/components/shared/state-presentations";
import { buttonVariants } from "@/components/ui/button";
import { formatAppointmentDate } from "@/features/appointments/appointment-date";
import { DashboardApplicationSummary } from "@/features/dashboard/components/dashboard-application-summary";
import { DashboardContextCard } from "@/features/dashboard/components/dashboard-context-card";
import { resolveNextActionCard } from "@/features/dashboard/dashboard-presentation";
import { getServiceCopy } from "@/features/services/presentation";
import type { DashboardSummary } from "@/features/dashboard/types";
import type { Locale, MessageDictionary } from "@/i18n";

type DashboardViewProps = Readonly<{
  locale: Locale;
  messages: MessageDictionary;
  summary: DashboardSummary;
}>;

function serviceName(serviceKey: ServiceKey, messages: MessageDictionary): string {
  return getServiceCopy(serviceKey, messages.services).name;
}

function statusPresentation(
  code: ApplicationStatusCode | "",
  messages: MessageDictionary["dashboard"],
): Readonly<{ label: string; tone: "neutral" | "success" | "warning" }> {
  if (code === "APPOINTMENT_BOOKED") return { label: messages.statusAppointmentBooked, tone: "success" };
  if (code === "COMPLETED") return { label: messages.statusCompleted, tone: "success" };
  if (code === "WAITLISTED") return { label: messages.statusWaitlisted, tone: "warning" };
  if (code === "SLOT_OFFERED") return { label: messages.statusSlotOffered, tone: "success" };
  if (code === "DRAFT") return { label: messages.statusDraft, tone: "neutral" };
  if (code === "IN_PROGRESS") return { label: messages.statusInProgress, tone: "warning" };
  if (code === "READY_FOR_IDENTITY") return { label: messages.statusReadyForIdentity, tone: "success" };
  if (code === "READY_FOR_PAYMENT") return { label: messages.statusReadyForPayment, tone: "success" };
  if (code === "READY_FOR_APPOINTMENT") return { label: messages.statusReadyForAppointment, tone: "success" };
  return { label: messages.statusUnknown, tone: "neutral" };
}

function nextActionPresentation(
  code: ApplicationNextActionCode,
  messages: MessageDictionary["dashboard"],
): string {
  if (code === "REVIEW_OFFER") return messages.nextActionReviewOffer;
  if (code === "REVIEW_WAITLIST") return messages.nextActionReviewWaitlist;
  if (code === "REVIEW_APPOINTMENT") return messages.nextActionReviewAppointment;
  if (code === "REVIEW_COMPLETION") return messages.nextActionReviewCompletion;
  if (code === "NONE") return messages.nextActionNone;
  if (code.startsWith("COMPLETE_")) return messages.nextActionResumeApplication;
  if (code === "VERIFY_IDENTITY") return messages.nextActionVerifyIdentity;
  if (code === "PAY_FEES") return messages.nextActionPayFees;
  if (code === "SELECT_APPOINTMENT") return messages.nextActionSelectAppointment;
  return messages.nextActionUnknown;
}

function blockingReasonPresentation(
  code: ApplicationBlockingReasonCode,
  messages: MessageDictionary["dashboard"],
): string {
  if (code === "NO_SUITABLE_SLOT") return messages.blockingNoSuitableSlot;
  if (code === "WAITLIST_OFFER_PENDING") return messages.blockingWaitlistOfferPending;
  if (code === "IDENTITY_VERIFICATION_REQUIRED") return messages.blockingIdentityRequired;
  if (code === "PAYMENT_REQUIRED") return messages.blockingPaymentRequired;
  return messages.blockingUnknown;
}

function formatDateTime(value: string, locale: Locale, fallback: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function replaceDashboardTokens(template: string, values: Readonly<Record<string, string>>): string {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replace(`{${key}}`, value),
    template,
  );
}

function localizedCodeLabel(labels: Readonly<Record<string, string>>, code: string, fallback: string): string {
  return labels[code] ?? fallback;
}

export function DashboardView({ locale, messages, summary }: DashboardViewProps) {
  const dashboard = messages.dashboard;
  const application = summary.application;
  const applicationStatus = statusPresentation(application?.statusCode ?? "", dashboard);
  const applicationProgress = application ? Math.min(100, Math.max(0, application.progressPercent)) : 0;
  const nextActionCard = application
    ? resolveNextActionCard(application, {
        defaultDescription: dashboard.nextActionDescription,
        readyForAppointmentDescription: dashboard.nextActionUnavailableDescription,
        appointmentBookedDescription: dashboard.nextActionBookedDescription,
        waitlistedDescription: dashboard.nextActionWaitlistedDescription,
        slotOfferedDescription: dashboard.nextActionOfferDescription,
        noActionDescription: dashboard.nextActionNoneDescription,
        continueLabel: messages.common.continue,
      })
    : undefined;
  const hasContext = Boolean(summary.waitlist || summary.offer || summary.appointment || summary.licence);

  return (
    <PageContainer className="space-y-8 py-10 sm:py-12 lg:space-y-10 lg:py-16">
      <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader eyebrow={dashboard.eyebrow} title={dashboard.title} description={dashboard.description} />
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
          <div className="rounded-item border border-border bg-surface-muted px-4 py-3">
            <p className="text-sm text-muted-foreground">{dashboard.greeting}</p>
            <p className="font-semibold text-secondary-foreground">{dashboard.syntheticCitizen}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonVariants({ variant: "outline" })} href="/applications">{dashboard.applicationsAction}</Link>
            {application ? (
              <Link className={buttonVariants({ variant: "ghost" })} href="/services">{messages.common.exploreServices}</Link>
            ) : null}
          </div>
        </div>
      </header>

      {!application ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <EmptyState title={dashboard.noApplicationTitle} description={dashboard.noApplicationDescription} />
          <NextActionCard
            eyebrow={dashboard.nextActionLabel}
            headingId="dashboard-next-action-title"
            title={messages.common.exploreServices}
            description={dashboard.noApplicationDescription}
            actionLabel={messages.common.exploreServices}
            actionHref="/services"
          />
        </div>
      ) : (
        <>
          <section aria-labelledby="dashboard-next-action-title">
            <NextActionCard
              eyebrow={dashboard.nextActionLabel}
              headingId="dashboard-next-action-title"
              title={nextActionPresentation(application.nextActionCode, dashboard)}
              description={nextActionCard?.description ?? dashboard.nextActionDescription}
              actionLabel={nextActionCard?.actionLabel}
              actionHref={nextActionCard?.actionHref}
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <DashboardApplicationSummary
              title={dashboard.activeApplicationTitle}
              serviceName={serviceName(application.serviceKey, messages)}
              description={dashboard.currentWorkDescription}
              status={applicationStatus.label}
              statusTone={applicationStatus.tone}
              progressLabel={dashboard.progressLabel}
              progressValue={applicationProgress}
              progressText={`${new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(applicationProgress)}%`}
              updatedLabel={dashboard.updatedLabel}
              updatedValue={formatDateTime(application.updatedAt, locale, messages.status.unavailable)}
            />
            {application.blockingReasonCode ? (
              <aside aria-labelledby="dashboard-blocking-title">
                <BlockingReasonAlert
                  title={dashboard.blockingTitle}
                  description={blockingReasonPresentation(application.blockingReasonCode, dashboard)}
                  headingId="dashboard-blocking-title"
                />
              </aside>
            ) : null}
          </div>
        </>
      )}

      {hasContext ? (
        <section className="space-y-5" aria-labelledby="support-summary-title">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="eyebrow">{dashboard.contextEyebrow}</p>
              <h2 id="support-summary-title" className="text-2xl font-bold tracking-[-0.025em]">{dashboard.supportTitle}</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {summary.offer ? (
              <DashboardContextCard
                tone="urgent"
                icon={<IconTile tone="warning"><TicketCheck aria-hidden="true" /></IconTile>}
                status={<StatusBadge tone="warning">{dashboard.offerStatus}</StatusBadge>}
                title={dashboard.offerTitle}
                description={replaceDashboardTokens(dashboard.offerDescription, {
                  rto: locale === "hi" ? summary.offer.rto.nameHi : summary.offer.rto.nameEn,
                  time: formatDateTime(summary.offer.expiresAt, locale, messages.status.unavailable),
                })}
              />
            ) : null}
            {summary.waitlist ? (
              <DashboardContextCard
                tone="urgent"
                icon={<IconTile tone="warning"><Clock3 aria-hidden="true" /></IconTile>}
                status={<StatusBadge tone="warning">{dashboard.waitlistStatus}</StatusBadge>}
                title={dashboard.waitlistTitle}
                description={replaceDashboardTokens(dashboard.waitlistDescription, {
                  rto: locale === "hi" ? summary.waitlist.rto.nameHi : summary.waitlist.rto.nameEn,
                  time: formatDateTime(summary.waitlist.joinedAt, locale, messages.status.unavailable),
                })}
              />
            ) : null}
            {summary.appointment ? (
              <DashboardContextCard
                icon={<IconTile tone="success"><CalendarClock aria-hidden="true" /></IconTile>}
                status={<StatusBadge tone="success">{dashboard.appointmentStatus}</StatusBadge>}
                title={dashboard.appointmentTitle}
                description={replaceDashboardTokens(dashboard.appointmentDescription, {
                  rto: locale === "hi" ? summary.appointment.rto.nameHi : summary.appointment.rto.nameEn,
                  time: `${formatAppointmentDate(summary.appointment.date, locale)}, ${summary.appointment.startTime}–${summary.appointment.endTime}`,
                })}
              />
            ) : null}
            {summary.licence ? (
              <DashboardContextCard
                tone="muted"
                icon={<IconTile tone="neutral"><IdCard aria-hidden="true" /></IconTile>}
                title={dashboard.licenceTitle}
                description={dashboard.licenceDescription.replace(
                  "{vehicleClass}",
                  localizedCodeLabel(
                    dashboard.vehicleClassNames,
                    summary.licence.vehicleClass,
                    messages.status.unavailable,
                  ),
                )}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}
