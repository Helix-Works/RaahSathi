import { redirect } from "next/navigation";

import { ErrorState } from "@/components/shared/state-presentations";
import { PageContainer } from "@/components/shared/page-container";
import { SessionExpiredState } from "@/features/auth/components/session-expired-state";
import { getShellSession } from "@/features/auth/session";
import { getDashboardSummary } from "@/features/dashboard/api";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import type { DashboardSummary } from "@/features/dashboard/types";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { ApiClientError } from "@/lib/api";

export default async function DashboardPage() {
  const [locale, session] = await Promise.all([getRequestLocale(), getShellSession()]);
  const messages = getDictionary(locale);

  if (session.kind === "anonymous") {
    redirect("/login?returnTo=/dashboard");
  }

  if (session.kind === "expired") {
    return <SessionExpiredState messages={messages} />;
  }

  let summary: DashboardSummary | undefined;
  let correlationId: string | undefined;

  try {
    summary = await getDashboardSummary();
  } catch (error: unknown) {
    if (error instanceof ApiClientError && error.status === 401) {
      return <SessionExpiredState messages={messages} />;
    }

    correlationId =
      error instanceof ApiClientError ? error.correlationId : undefined;
    summary = undefined;
  }

  if (!summary) {
    return (
      <PageContainer className="max-w-4xl py-10 sm:py-12 lg:py-14">
        <ErrorState
          title={messages.dashboard.dataUnavailableTitle}
          description={messages.dashboard.dataUnavailableDescription}
          retryLabel={messages.common.retry}
          retryHref="/dashboard"
          correlationId={correlationId}
          correlationLabel={messages.errors.correlationLabel}
          headingLevel={1}
        />
      </PageContainer>
    );
  }

  return <DashboardView displayName={session.user.displayName} locale={locale} messages={messages} summary={summary} />;
}
