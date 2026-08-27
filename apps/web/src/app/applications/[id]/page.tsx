import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import type { ApplicationDetail } from "@raahsathi/contracts/applications";

import { ApplicationEditor } from "@/features/applications/components/application-editor";
import { PageContainer } from "@/components/shared/page-container";
import { LicenceContextCard } from "@/features/identity/components/licence-context-card";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { getApplication } from "@/server/applications/application-service";
import { resolveSessionFromCookie } from "@/server/auth/session-service";
import { ApiError } from "@/server/http/api-error";
import { getIdentityContext } from "@/server/identity/identity-service";
import { listLicences } from "@/server/licences/licence-service";
import { getPaymentContextForApplication } from "@/server/payments/payment-service";
import { listAppointments } from "@/server/appointments/appointment-service";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  const session = await resolveSessionFromCookie(
    (await cookies()).toString(),
  );

  if (session.kind !== "authenticated") {
    redirect(`/login?returnTo=/applications/${id}`);
  }

  let application: ApplicationDetail;

  try {
    application = await getApplication(session.context, id);
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const locale = await getRequestLocale();
  const messages = getDictionary(locale);

  const [identity, licences, payment, appointments] = await Promise.all([
    getIdentityContext(session.context, id),
    listLicences(session.context),
    getPaymentContextForApplication(session.context, id),
    listAppointments(session.context),
  ]);
  const appointment = appointments.find(
    (item) => item.applicationId === id && item.status === "CONFIRMED",
  );

  return (
    <PageContainer className="max-w-5xl space-y-6 py-10 sm:py-12 lg:py-16">
      <LicenceContextCard
        licences={licences}
        locale={locale}
        messages={messages.identity.licenceContext}
      />
      <ApplicationEditor
        initialApplication={application}
        initialIdentity={identity}
        initialPayment={payment}
        initialAppointment={appointment}
        locale={locale}
        messages={messages}
      />
    </PageContainer>
  );
}
