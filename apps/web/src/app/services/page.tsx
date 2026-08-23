import type { ServiceKey, ServiceSummary } from "@raahsathi/contracts";
import { CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  EmptyState,
  ErrorState,
} from "@/components/shared/state-presentations";
import { StartApplicationButton } from "@/features/applications/components/start-application-button";
import { getMockServices } from "@/features/services/api/mock";
import { getDictionary, type MessageDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { dataSource } from "@/lib/data-source";
import { listAvailableServices } from "@/server/applications/service-catalogue";

function getServiceCopy(
  serviceKey: ServiceKey,
  messages: MessageDictionary["services"],
): Readonly<{ name: string; description: string }> {
  switch (serviceKey) {
    case "LEARNER_LICENCE":
      return {
        name: messages.learnerName,
        description: messages.learnerDescription,
      };
    case "PERMANENT_DRIVING_LICENCE":
      return {
        name: messages.permanentName,
        description: messages.permanentDescription,
      };
  }
}

export default async function ServicesPage() {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  let services: readonly ServiceSummary[];

  try {
    services = dataSource === "real"
      ? listAvailableServices()
      : await getMockServices();
  } catch {
    return (
      <div className="mx-auto max-w-[80rem] space-y-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <PageHeader
          eyebrow={messages.services.eyebrow}
          title={messages.services.title}
          description={messages.services.description}
        />
        <ErrorState
          title={messages.errors.servicesTitle}
          description={messages.errors.servicesDescription}
          retryLabel={messages.common.retry}
          retryHref="/services"
          correlationLabel={messages.errors.correlationLabel}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[80rem] space-y-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="grid gap-6 border-b border-border-strong pb-8 lg:grid-cols-[1fr_20rem] lg:items-end">
        <PageHeader
          eyebrow={messages.services.eyebrow}
          title={messages.services.title}
          description={messages.services.description}
        />
        <p className="border-l-2 border-foreground pl-4 text-sm font-bold leading-6 text-muted-foreground">
          {messages.disclosure.description}
        </p>
      </div>

      {services.length === 0 ? (
        <EmptyState
          title={messages.services.emptyTitle}
          description={messages.services.emptyDescription}
        />
      ) : (
        <div className="grid border-t border-border-strong">
          {services.map((service, index) => {
            const copy = getServiceCopy(service.serviceKey, messages.services);

            return (
              <article
                key={service.serviceKey}
                className="grid gap-5 border-b border-border-strong bg-card px-5 py-6 md:grid-cols-[3.5rem_1fr] md:px-6 lg:grid-cols-[4rem_1fr_auto] lg:items-center lg:gap-8 lg:px-7 lg:py-7"
              >
                <p className="text-3xl font-black tracking-[-0.04em] text-muted-foreground" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em]">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    {messages.services.availableStatus}
                  </span>
                  <h2 className="text-xl font-black leading-snug tracking-[-0.025em] sm:text-2xl">{copy.name}</h2>
                  <p className="max-w-2xl leading-6 text-muted-foreground">{copy.description}</p>
                </div>
                <div className="md:col-start-2 lg:col-start-auto">
                  <StartApplicationButton
                    serviceKey={service.serviceKey}
                    label={messages.common.continue}
                    errorLabel={messages.services.startFailed}
                    loginPath="/login?returnTo=/services"
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
