import type { ServiceKey, ServiceSummary } from "@raahsathi/contracts";
import { Clock3 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  EmptyState,
  ErrorState,
  StatusBadge,
} from "@/components/shared/state-presentations";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getServices } from "@/features/services/api";
import { getDictionary, type MessageDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { ApiClientError } from "@/lib/api";

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
    services = await getServices();
  } catch (error) {
    const correlationId =
      error instanceof ApiClientError ? error.correlationId : undefined;

    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
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
          correlationId={correlationId}
          correlationLabel={messages.errors.correlationLabel}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <PageHeader
        eyebrow={messages.services.eyebrow}
        title={messages.services.title}
        description={messages.services.description}
      />

      {services.length === 0 ? (
        <EmptyState
          title={messages.services.emptyTitle}
          description={messages.services.emptyDescription}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {services.map((service) => {
            const copy = getServiceCopy(service.serviceKey, messages.services);

            return (
              <Card key={service.serviceKey} className="flex h-full flex-col">
                <CardHeader>
                  <StatusBadge tone="warning">{messages.status.upcoming}</StatusBadge>
                  <h2 className="text-2xl font-black tracking-tight">{copy.name}</h2>
                  <p className="leading-7 text-muted-foreground">{copy.description}</p>
                </CardHeader>
                <CardContent className="mt-auto">
                  <span
                    className={buttonVariants({ variant: "outline" })}
                    aria-disabled="true"
                  >
                    <Clock3 className="size-4" aria-hidden="true" />
                    {messages.services.unavailableAction}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
