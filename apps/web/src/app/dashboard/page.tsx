import { redirect } from "next/navigation";

import { ErrorState } from "@/components/shared/state-presentations";
import { SessionExpiredState } from "@/features/auth/components/session-expired-state";
import { getShellSession } from "@/features/auth/session";
import { getDashboardSummary } from "@/features/dashboard/api";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import type { DashboardSummary } from "@/features/dashboard/types";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  const session = await getShellSession();

  if (session.kind === "anonymous") {
    redirect("/login?returnTo=/dashboard");
  }

  if (session.kind === "expired") {
    return <SessionExpiredState messages={messages} />;
  }

  let summary: DashboardSummary | undefined;

  try {
    summary = await getDashboardSummary(session.dashboardScenario);
  } catch {
    summary = undefined;
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ErrorState
          title={messages.dashboard.dataUnavailableTitle}
          description={messages.dashboard.dataUnavailableDescription}
          retryLabel={messages.auth.reauthenticate}
          retryHref="/login?returnTo=/dashboard"
          headingLevel={1}
        />
      </div>
    );
  }

  return <DashboardView locale={locale} messages={messages} summary={summary} />;
}
