import type { ServiceSummary } from "@raahsathi/contracts";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { PrototypeDisclosure } from "@/components/shared/prototype-disclosure";
import { ServiceCard } from "@/components/shared/service-card";
import { EmptyState, ErrorState } from "@/components/shared/state-presentations";
import { buttonVariants } from "@/components/ui/button";
import { StartApplicationButton } from "@/features/applications/components/start-application-button";
import { getMockServices } from "@/features/services/api/mock";
import { getServiceCopy } from "@/features/services/presentation";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { dataSource } from "@/lib/data-source";
import { listAvailableServices } from "@/server/applications/service-catalogue";

export default async function ServicesPage() {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  let services: readonly ServiceSummary[];

  try {
    services = dataSource === "real" ? listAvailableServices() : await getMockServices();
  } catch {
    return (
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <PageHeader eyebrow={messages.services.eyebrow} title={messages.services.title} description={messages.services.description} />
        <ErrorState title={messages.errors.servicesTitle} description={messages.errors.servicesDescription} retryLabel={messages.common.retry} retryHref="/services" correlationLabel={messages.errors.correlationLabel} />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-10 py-10 sm:py-12 lg:space-y-12 lg:py-16">
      <div className="grid gap-7 border-b border-border pb-10 lg:grid-cols-[1fr_22rem] lg:items-end">
        <PageHeader eyebrow={messages.services.eyebrow} title={messages.services.title} description={messages.services.description} />
        <PrototypeDisclosure title={messages.disclosure.title} description={messages.disclosure.description} />
      </div>
      {services.length === 0 ? (
        <EmptyState title={messages.services.emptyTitle} description={messages.services.emptyDescription} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {services.map((service) => {
            const copy = getServiceCopy(service.serviceKey, messages.services);
            return <ServiceCard key={service.serviceKey} serviceKey={service.serviceKey} name={copy.name} description={copy.description} availabilityLabel={messages.services.availableStatus} action={<StartApplicationButton serviceKey={service.serviceKey} label={messages.common.continue} errorLabel={messages.services.startFailed} loginPath="/login?returnTo=/services" />} />;
          })}
        </div>
      )}
      <div className="border-t border-border pt-8">
        <Link className={buttonVariants({ variant: "ghost" })} href="/"><ArrowRight className="size-4 rotate-180" aria-hidden="true" />{messages.services.backToHome}</Link>
      </div>
    </PageContainer>
  );
}
