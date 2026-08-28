import type { ServiceKey } from "@raahsathi/contracts";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-presentations";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationListItem } from "@/features/applications/components/application-list-item";
import { getServiceCopy } from "@/features/services/presentation";
import { getDictionary, type MessageDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { listApplications } from "@/server/applications/application-service";
import { resolveSessionFromCookie } from "@/server/auth/session-service";

function serviceName(serviceKey: ServiceKey, messages: MessageDictionary): string {
  return getServiceCopy(serviceKey, messages.services).name;
}

export default async function ApplicationsPage() {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  const session = await resolveSessionFromCookie((await cookies()).toString());

  if (session.kind !== "authenticated") redirect("/login?returnTo=/applications");

  const applications = await listApplications(session.context);
  const statusLabels = {
    DRAFT: messages.applications.statusDraft,
    IN_PROGRESS: messages.applications.statusInProgress,
    READY_FOR_IDENTITY: messages.applications.statusReadyForIdentity,
    READY_FOR_PAYMENT: messages.applications.statusReadyForPayment,
    READY_FOR_APPOINTMENT: messages.applications.statusReadyForAppointment,
    WAITLISTED: messages.applications.statusWaitlisted,
    SLOT_OFFERED: messages.applications.statusSlotOffered,
    APPOINTMENT_BOOKED: messages.applications.statusAppointmentBooked,
    COMPLETED: messages.applications.statusCompleted,
  };
  const actionLabels = {
    COMPLETE_PERSONAL_DETAILS: messages.applications.nextPersonalDetails,
    COMPLETE_ADDRESS: messages.applications.nextAddress,
    COMPLETE_SERVICE_DETAILS: messages.applications.nextServiceDetails,
    COMPLETE_DECLARATION: messages.applications.nextDeclaration,
    VERIFY_IDENTITY: messages.applications.nextIdentity,
    PAY_FEES: messages.applications.nextPayment,
    SELECT_APPOINTMENT: messages.applications.nextAppointment,
    REVIEW_WAITLIST: messages.applications.nextReviewWaitlist,
    REVIEW_OFFER: messages.applications.nextReviewOffer,
    REVIEW_APPOINTMENT: messages.applications.nextReviewAppointment,
    REVIEW_COMPLETION: messages.applications.nextReviewCompletion,
    NONE: messages.applications.nextActionNone,
  };

  return (
    <PageContainer className="space-y-8 py-10 sm:py-12 lg:space-y-10 lg:py-16">
      <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow={messages.applications.eyebrow}
          title={messages.applications.listTitle}
        />
        <Link className={buttonVariants({ variant: "outline" })} href="/services">{messages.common.exploreServices}</Link>
      </div>
      {applications.length === 0 ? (
        <EmptyState title={messages.applications.emptyTitle} description={messages.applications.emptyDescription} />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <ApplicationListItem
              key={application.id}
              serviceName={serviceName(application.serviceKey, messages)}
              status={statusLabels[application.statusCode]}
              nextAction={actionLabels[application.nextActionCode]}
              updatedLabel={messages.applications.updatedLabel}
              updatedValue={new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(application.updatedAt))}
              resumeLabel={messages.applications.resume}
              href={`/applications/${application.id}`}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
