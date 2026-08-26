import type { ServiceKey } from "@raahsathi/contracts";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-presentations";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary, type MessageDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { listApplications } from "@/server/applications/application-service";
import { resolveSessionFromCookie } from "@/server/auth/session-service";

function serviceName(serviceKey: ServiceKey, messages: MessageDictionary): string {
  return serviceKey === "LEARNER_LICENCE"
    ? messages.services.learnerName
    : messages.services.permanentName;
}

export default async function ApplicationsPage() {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  const session = await resolveSessionFromCookie((await cookies()).toString());

  if (session.kind !== "authenticated") {
    redirect("/login?returnTo=/applications");
  }

  const applications = await listApplications(session.context);
  const hindi = locale === "hi";
  const statusLabels = {
    DRAFT: messages.applications.statusDraft,
    IN_PROGRESS: messages.applications.statusInProgress,
    READY_FOR_IDENTITY: messages.applications.statusReadyForIdentity,
    READY_FOR_PAYMENT: messages.applications.statusReadyForPayment,
    READY_FOR_APPOINTMENT: messages.applications.statusReadyForAppointment,
    WAITLISTED: messages.applications.statusWaitlisted,
    SLOT_OFFERED: messages.applications.statusSlotOffered,
    APPOINTMENT_BOOKED: messages.applications.statusAppointmentBooked,
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
    NONE: messages.applications.nextActionNone,
  };

  return (
    <div className="mx-auto max-w-[80rem] space-y-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="border-b border-border-strong pb-8">
        <PageHeader
          eyebrow={hindi ? "नागरिक यात्रा" : "Citizen journey"}
          title={hindi ? "आपके आवेदन" : "Your applications"}
          description={
            hindi
              ? "सहेजे गए आवेदन पर लौटें और वहीं से आगे बढ़ें जहाँ आपने छोड़ा था।"
              : "Return to a saved application and continue from where you left off."
          }
        />
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title={hindi ? "अभी कोई आवेदन नहीं है" : "No applications yet"}
          description={
            hindi
              ? "उपलब्ध सेवाओं में से कृत्रिम आवेदन शुरू करें।"
              : "Start a synthetic application from the available services."
          }
        />
      ) : (
        <div className="grid border-t border-border-strong">
          {applications.map((application) => (
            <Card
              key={application.id}
              className="grid gap-4 rounded-none border-x-0 border-t-0 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
            >
              <CardHeader className="space-y-2 p-0">
                <CardTitle>{serviceName(application.serviceKey, messages)}</CardTitle>
                <p className="text-sm font-bold">{statusLabels[application.statusCode]}</p>
                <p className="text-sm text-muted-foreground">{actionLabels[application.nextActionCode]}</p>
                <p className="text-xs text-muted-foreground">
                  {messages.applications.updatedLabel}: {new Date(application.updatedAt).toLocaleString(
                    hindi ? "hi-IN" : "en-IN",
                    { timeZone: "Asia/Kolkata" },
                  )}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-4 p-0 sm:justify-end">
                <span className="text-sm font-black">
                  {new Intl.NumberFormat(hindi ? "hi-IN" : "en-IN").format(
                    application.progressPercent,
                  )}
                  %
                </span>
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={`/applications/${application.id}`}
                >
                  {hindi ? "जारी रखें" : "Resume"}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
