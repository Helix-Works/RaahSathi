import type {
  ApplicationNextActionCode,
  ApplicationStatusCode,
  ServiceKey,
} from "@raahsathi/contracts/applications";
import { ArrowRight, CalendarClock, Clock3, IdCard, TicketCheck } from "lucide-react";
import Link from "next/link";

import { HeroSurface } from "@/components/shared/hero-surface";
import { IconTile } from "@/components/shared/icon-tile";
import { PageContainer } from "@/components/shared/page-container";
import { SectionHeader } from "@/components/shared/section-header";
import { ServiceCard } from "@/components/shared/service-card";
import { EmptyState, StatusBadge } from "@/components/shared/state-presentations";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationListItem } from "@/features/applications/components/application-list-item";
import { StartApplicationButton } from "@/features/applications/components/start-application-button";
import { formatAppointmentDate } from "@/features/appointments/appointment-date";
import { DashboardContextCard } from "@/features/dashboard/components/dashboard-context-card";
import { resolveNextActionCard, selectHeroApplication } from "@/features/dashboard/dashboard-presentation";
import type { DashboardSummary } from "@/features/dashboard/types";
import { getServiceCopy } from "@/features/services/presentation";
import type { Locale, MessageDictionary } from "@/i18n";

type DashboardViewProps = Readonly<{
  displayName: string;
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

function nextActionPresentation(code: ApplicationNextActionCode, messages: MessageDictionary["dashboard"]): string {
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

function formatDateTime(value: string, locale: Locale, fallback: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function replaceTokens(template: string, values: Readonly<Record<string, string>>): string {
  return Object.entries(values).reduce((message, [key, value]) => message.replace(`{${key}}`, value), template);
}

function applicationReference(id: string): string {
  if (id.startsWith("app_")) {
    return `RS-${id.split("_").slice(1).map((part) => part.charAt(0)).join("").toUpperCase()}`;
  }
  return `RS-${id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`;
}

export function DashboardView({ displayName, locale, messages, summary }: DashboardViewProps) {
  const dashboard = messages.dashboard;
  const heroApplication = selectHeroApplication(summary.applications);
  const orderedApplications = heroApplication
    ? [
        heroApplication,
        ...summary.applications
          .filter(({ id }) => id !== heroApplication.id)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
      ]
    : [];
  const nextActionCard = heroApplication
    ? resolveNextActionCard(heroApplication, {
        defaultDescription: dashboard.nextActionDescription,
        completionDescription: dashboard.nextActionCompletionDescription,
        readyForAppointmentDescription: dashboard.nextActionUnavailableDescription,
        appointmentBookedDescription: dashboard.nextActionBookedDescription,
        waitlistedDescription: dashboard.nextActionWaitlistedDescription,
        slotOfferedDescription: dashboard.nextActionOfferDescription,
        noActionDescription: dashboard.nextActionNoneDescription,
        continueLabel: messages.common.continue,
      })
    : undefined;
  const hasContext = summary.offers.length + summary.waitlistEntries.length + summary.appointments.length + summary.licences.length > 0;

  return (
    <div className="pb-14 sm:pb-16">
      <PageContainer className="pt-6 sm:pt-8 lg:pt-10">
        <HeroSurface
          titleId="dashboard-title"
          title={dashboard.welcomeTitle.replace("{name}", displayName)}
          description={dashboard.description}
          variant="featured"
          actions={nextActionCard?.actionLabel && nextActionCard.actionHref ? (
            <Link className={`${buttonVariants({ variant: "secondary", size: "lg" })} border-white/70 bg-white text-primary! hover:border-white hover:bg-white/90`} href={nextActionCard.actionHref}>
              {nextActionCard.actionLabel}<ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : undefined}
        />
      </PageContainer>

      <PageContainer className="py-8 sm:py-10 lg:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-stretch lg:gap-10">
          <section className="space-y-6 lg:grid lg:self-stretch lg:grid-rows-[auto_1fr] lg:gap-6 lg:space-y-0" aria-labelledby="continue-work-title">
            <SectionHeader
              id="continue-work-title"
              title={dashboard.continueWorkTitle}
              description={dashboard.continueWorkDescription}
            />
            {orderedApplications.length > 0 ? (
              <div className="space-y-4 lg:flex lg:flex-1 lg:flex-col lg:justify-between">
                {orderedApplications.map((application) => {
                  const status = statusPresentation(application.statusCode, dashboard);
                  return (
                    <ApplicationListItem
                      key={application.id}
                      className="lg:flex-1"
                      serviceName={serviceName(application.serviceKey, messages)}
                      status={status.label}
                      nextAction={nextActionPresentation(application.nextActionCode, dashboard)}
                      nextActionLabel={messages.applications.nextActionLabel}
                      updatedLabel={dashboard.updatedLabel}
                      updatedValue={formatDateTime(application.updatedAt, locale, messages.status.unavailable)}
                      referenceLabel={messages.applications.referenceLabel}
                      referenceValue={applicationReference(application.id)}
                      progressLabel={dashboard.progressLabel}
                      progress={application.progressPercent}
                      progressText={`${new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(application.progressPercent)}%`}
                      resumeLabel={messages.applications.resume}
                      href={`/applications/${application.id}`}
                      compact
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState title={dashboard.noApplicationTitle} description={dashboard.noApplicationDescription} />
            )}
          </section>

          <div className="space-y-8 lg:space-y-10">
            {hasContext ? (
              <section className="space-y-5" aria-labelledby="support-summary-title">
                <SectionHeader id="support-summary-title" title={dashboard.supportTitle} description={dashboard.supportDescription} />
                <div className="grid gap-4">
                    {summary.offers.map((offer) => (
                      <DashboardContextCard
                        key={offer.id}
                        tone="urgent"
                        icon={<IconTile tone="warning"><TicketCheck aria-hidden="true" /></IconTile>}
                        status={<StatusBadge tone="warning">{dashboard.offerStatus}</StatusBadge>}
                        title={dashboard.offerTitle}
                        description={replaceTokens(dashboard.offerDescription, {
                          rto: locale === "hi" ? offer.rto.nameHi : offer.rto.nameEn,
                          time: formatDateTime(offer.expiresAt, locale, messages.status.unavailable),
                        })}
                      />
                    ))}
                    {summary.waitlistEntries.map((entry) => (
                      <DashboardContextCard
                        key={entry.id}
                        tone="urgent"
                        icon={<IconTile tone="warning"><Clock3 aria-hidden="true" /></IconTile>}
                        status={<StatusBadge tone="warning">{dashboard.waitlistStatus}</StatusBadge>}
                        title={dashboard.waitlistTitle}
                        description={replaceTokens(dashboard.waitlistDescription, {
                          rto: locale === "hi" ? entry.rto.nameHi : entry.rto.nameEn,
                          time: formatDateTime(entry.joinedAt, locale, messages.status.unavailable),
                        })}
                      />
                    ))}
                    {summary.appointments.map((appointment) => (
                      <DashboardContextCard
                        key={appointment.id}
                        icon={<IconTile tone="success"><CalendarClock aria-hidden="true" /></IconTile>}
                        status={<StatusBadge tone="success">{dashboard.appointmentStatus}</StatusBadge>}
                        title={dashboard.appointmentTitle}
                        description={replaceTokens(dashboard.appointmentDescription, {
                          rto: locale === "hi" ? appointment.rto.nameHi : appointment.rto.nameEn,
                          time: `${formatAppointmentDate(appointment.date, locale)}, ${appointment.startTime}–${appointment.endTime}`,
                        })}
                      />
                    ))}
                    {summary.licences.map((licence, index) => (
                      <DashboardContextCard
                        key={`${licence.kind}-${licence.vehicleClass}-${index}`}
                        tone="muted"
                        icon={<IconTile tone="neutral"><IdCard aria-hidden="true" /></IconTile>}
                        title={dashboard.licenceTitle}
                        description={dashboard.licenceDescription.replace(
                          "{vehicleClass}",
                          dashboard.vehicleClassNames[licence.vehicleClass] ?? messages.status.unavailable,
                        )}
                      />
                    ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-6" aria-labelledby="dashboard-services-title">
              <SectionHeader
                id="dashboard-services-title"
                title={dashboard.servicesTitle}
                description={dashboard.servicesDescription}
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {summary.services.map((service) => {
                  const copy = getServiceCopy(service.serviceKey, messages.services);
                  return (
                    <ServiceCard
                      key={service.serviceKey}
                      serviceKey={service.serviceKey}
                      name={copy.name}
                      availabilityLabel={messages.services.availableStatus}
                      compact
                      action={
                        <StartApplicationButton
                          serviceKey={service.serviceKey}
                          label={messages.common.continue}
                          errorLabel={messages.services.startFailed}
                          eligibleLicenceRequiredLabel={messages.services.eligibleLicenceRequired}
                          loginPath="/login?returnTo=/dashboard"
                        />
                      }
                    />
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
