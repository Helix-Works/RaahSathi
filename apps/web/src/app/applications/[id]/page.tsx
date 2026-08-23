import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import type { ApplicationDetail } from "@raahsathi/contracts/applications";

import { ApplicationEditor } from "@/features/applications/components/application-editor";
import { LicenceContextCard } from "@/features/identity/components/licence-context-card";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { getApplication } from "@/server/applications/application-service";
import { resolveSessionFromCookie } from "@/server/auth/session-service";
import { ApiError } from "@/server/http/api-error";
import { getIdentityContext } from "@/server/identity/identity-service";
import { listLicences } from "@/server/licences/licence-service";

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

  const [identity, licences] = await Promise.all([
    getIdentityContext(session.context, id),
    listLicences(session.context),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <ApplicationEditor
        initialApplication={application}
        initialIdentity={identity}
        locale={locale}
        messages={messages}
      />

      <LicenceContextCard
        licences={licences}
        locale={locale}
      />
    </div>
  );
}
