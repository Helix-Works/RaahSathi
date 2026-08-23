import type { ServiceKey } from "@raahsathi/contracts";
import { CalendarClock, Clock3, IdCard, TicketCheck } from "lucide-react";

import { BlockingReasonAlert } from "@/components/shared/blocking-reason-alert";
import { PageHeader } from "@/components/shared/page-header";
import {
  EmptyState,
  NextActionCard,
  StatusBadge,
} from "@/components/shared/state-presentations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DashboardSummary } from "@/features/dashboard/types";
import type { Locale, MessageDictionary } from "@/i18n";

type DashboardViewProps = Readonly<{
  locale: Locale;
  messages: MessageDictionary;
  summary: DashboardSummary;
}>;

function serviceName(
  serviceKey: ServiceKey,
  messages: MessageDictionary,
): string {
  return serviceKey === "LEARNER_LICENCE"
    ? messages.services.learnerName
    : messages.services.permanentName;
}

function statusPresentation(
  code: string,
  messages: MessageDictionary["dashboard"],
): Readonly<{ label: string; tone: "neutral" | "success" | "warning" }> {
  if (code === "APPOINTMENT_REQUIRED") {
    return { label: messages.statusAppointmentRequired, tone: "warning" };
  }

  if (code === "APPOINTMENT_BOOKED") {
    return { label: messages.statusAppointmentBooked, tone: "success" };
  }

  if (code === "DRAFT") return { label: messages.statusDraft, tone: "neutral" };
  if (code === "IN_PROGRESS") return { label: messages.statusInProgress, tone: "warning" };
  if (code === "READY_FOR_IDENTITY") return { label: messages.statusReadyForIdentity, tone: "success" };
  if (code === "READY_FOR_PAYMENT") return { label: messages.statusReadyForPayment, tone: "success" };
  if (code === "READY_FOR_APPOINTMENT") return { label: messages.statusReadyForAppointment, tone: "success" };

  return { label: messages.statusUnknown, tone: "neutral" };
}

function nextActionPresentation(
  code: string,
  messages: MessageDictionary["dashboard"],
): string {
  if (code === "REVIEW_OFFER") {
    return messages.nextActionReviewOffer;
  }

  if (code === "NONE") {
    return messages.nextActionNone;
  }

  if (code.startsWith("COMPLETE_")) return messages.nextActionResumeApplication;
  if (code === "VERIFY_IDENTITY") return messages.nextActionVerifyIdentity;
  if (code === "PAY_FEES") return messages.nextActionPayFees;
  if (code === "SELECT_APPOINTMENT") return messages.nextActionSelectAppointment;

  return messages.nextActionUnknown;
}

function blockingReasonPresentation(
  code: string,
  messages: MessageDictionary["dashboard"],
): string {
  if (code === "NO_SUITABLE_SLOT") return messages.blockingNoSuitableSlot;
  if (code === "IDENTITY_VERIFICATION_REQUIRED") return messages.blockingIdentityRequired;
  if (code === "PAYMENT_REQUIRED") return messages.blockingPaymentRequired;
  return messages.blockingUnknown;
}

function formatDateTime(value: string, locale: Locale, fallback: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function replaceDashboardTokens(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replace(`{${key}}`, value),
    template,
  );
}

function localizedCodeLabel(
  labels: Readonly<Record<string, string>>,
  code: string,
  fallback: string,
): string {
  return labels[code] ?? fallback;
}

export function DashboardView({ locale, messages, summary }: DashboardViewProps) {
  const dashboard = messages.dashboard;
  const application = summary.application;
  const applicationStatus = statusPresentation(
    application?.statusCode ?? "",
    dashboard,
  );
  const applicationProgress = application
    ? Math.min(100, Math.max(0, application.progressPercent))
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow={dashboard.eyebrow}
          title={dashboard.title}
          description={dashboard.description}
        />
        <div className="rounded-2xl border border-border bg-card px-5 py-4 lg:min-w-52">
          <p className="text-sm text-muted-foreground">{dashboard.greeting}</p>
          <p className="font-black">{dashboard.syntheticCitizen}</p>
        </div>
      </div>

      {!application ? (
        <div className="space-y-6">
          <EmptyState
            title={dashboard.noApplicationTitle}
            description={dashboard.noApplicationDescription}
          />
          <NextActionCard
            title={messages.common.exploreServices}
            description={dashboard.noApplicationDescription}
            actionLabel={messages.common.exploreServices}
            actionHref="/services"
          />
        </div>
      ) : (
        <section className="space-y-6" aria-labelledby="active-application-title">
          <Card>
            <CardHeader className="gap-4 border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="eyebrow">{dashboard.activeApplicationTitle}</p>
                <StatusBadge tone={applicationStatus.tone}>
                  {applicationStatus.label}
                </StatusBadge>
              </div>
              <div className="space-y-2">
                <h2 id="active-application-title" className="text-2xl font-black tracking-tight">
                  {serviceName(application.serviceKey, messages)}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {dashboard.currentWorkDescription}
                </p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 pt-6 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm font-bold">
                  <span>{dashboard.progressLabel}</span>
                  <span>
                    {new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(
                      applicationProgress,
                    )}
                    %
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={dashboard.progressLabel}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={applicationProgress}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${applicationProgress}%`,
                    }}
                  />
                </div>
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="size-4" aria-hidden="true" />
                {dashboard.updatedLabel}:{" "}
                {formatDateTime(application.updatedAt, locale, messages.status.unavailable)}
              </p>
            </CardContent>
          </Card>

          {application.blockingReasonCode ? (
            <BlockingReasonAlert
              title={dashboard.blockingTitle}
              description={blockingReasonPresentation(
                application.blockingReasonCode,
                dashboard,
              )}
            />
          ) : null}

          <NextActionCard
            title={nextActionPresentation(application.nextActionCode, dashboard)}
            description={application.nextActionCode === "NONE"
              ? dashboard.nextActionUnavailableDescription
              : dashboard.nextActionDescription}
            actionLabel={application.nextActionCode === "NONE" ? undefined : messages.common.continue}
            actionHref={application.nextActionCode === "NONE" ? undefined : `/applications/${application.id}`}
          />
        </section>
      )}

      {summary.offer || summary.appointment || summary.licence ? (
        <section className="space-y-5" aria-labelledby="support-summary-title">
          <h2 id="support-summary-title" className="text-2xl font-black tracking-tight">
            {dashboard.supportTitle}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.offer ? (
              <Card>
                <CardContent className="space-y-4 py-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-warning/10 text-warning">
                    <TicketCheck className="size-5" aria-hidden="true" />
                  </span>
                  <StatusBadge tone="warning">{dashboard.offerStatus}</StatusBadge>
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold">{dashboard.offerTitle}</h3>
                    <p className="leading-7 text-muted-foreground">
                      {replaceDashboardTokens(dashboard.offerDescription, {
                        rto: localizedCodeLabel(
                          dashboard.rtoNames,
                          summary.offer.rtoCode,
                          messages.status.unavailable,
                        ),
                        time: formatDateTime(
                          summary.offer.expiresAt,
                          locale,
                          messages.status.unavailable,
                        ),
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {summary.appointment ? (
              <Card>
                <CardContent className="space-y-4 py-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-success/10 text-success">
                    <CalendarClock className="size-5" aria-hidden="true" />
                  </span>
                  <StatusBadge tone="success">{dashboard.appointmentStatus}</StatusBadge>
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold">{dashboard.appointmentTitle}</h3>
                    <p className="leading-7 text-muted-foreground">
                      {replaceDashboardTokens(dashboard.appointmentDescription, {
                        rto: localizedCodeLabel(
                          dashboard.rtoNames,
                          summary.appointment.rtoCode,
                          messages.status.unavailable,
                        ),
                        time: formatDateTime(
                          summary.appointment.startsAt,
                          locale,
                          messages.status.unavailable,
                        ),
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {summary.licence ? (
              <Card>
                <CardContent className="space-y-4 py-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                    <IdCard className="size-5" aria-hidden="true" />
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold">{dashboard.licenceTitle}</h3>
                    <p className="leading-7 text-muted-foreground">
                      {dashboard.licenceDescription.replace(
                        "{vehicleClass}",
                        localizedCodeLabel(
                          dashboard.vehicleClassNames,
                          summary.licence.vehicleClassCode,
                          messages.status.unavailable,
                        ),
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
