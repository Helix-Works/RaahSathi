import type { ServiceSummary } from "@raahsathi/contracts";
import { ArrowRight, CalendarDays, CheckCircle2, Languages, RotateCcw } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { HeroSurface } from "@/components/shared/hero-surface";
import { IconTile } from "@/components/shared/icon-tile";
import { PageContainer } from "@/components/shared/page-container";
import { SectionHeader } from "@/components/shared/section-header";
import { ServiceCard } from "@/components/shared/service-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getShellSession } from "@/features/auth/session";
import { getMockServices } from "@/features/services/api/mock";
import { getServiceCopy } from "@/features/services/presentation";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { dataSource } from "@/lib/data-source";
import { listAvailableServices } from "@/server/applications/service-catalogue";

export default async function Home() {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  const session = await getShellSession();

  if (session.kind === "authenticated") redirect("/dashboard");

  const landing = messages.landing;
  let services: readonly ServiceSummary[] = [];
  try {
    services = dataSource === "real" ? listAvailableServices() : await getMockServices();
  } catch {
    services = [];
  }

  const strengths = [
    { title: landing.recoveryTitle, description: landing.recoveryDescription, icon: RotateCcw },
    { title: landing.statusTitle, description: landing.statusDescription, icon: CheckCircle2 },
    { title: landing.appointmentsTitle, description: landing.appointmentsDescription, icon: CalendarDays },
    { title: landing.languageTitle, description: landing.languageDescription, icon: Languages },
  ] as const;
  const steps = [landing.stepChoose, landing.stepSave, landing.stepFollow, landing.stepBook] as const;

  return (
    <div className="overflow-hidden pb-14 sm:pb-20">
      <PageContainer className="pt-6 pb-4 sm:pt-8 sm:pb-6 lg:pt-10">
        <HeroSurface
          titleId="landing-title"
          title={landing.title}
          description={landing.tagline}
          variant="featured"
          actions={
            <>
              <Link className={`${buttonVariants({ variant: "secondary", size: "lg" })} border-white/70 bg-white text-primary! hover:border-white hover:bg-white/90`} href="/services">
                {messages.common.exploreServices}<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link className={`${buttonVariants({ variant: "outline", size: "lg" })} border-white/60 bg-transparent text-primary-foreground! hover:border-white hover:bg-white/15 hover:text-primary-foreground!`} href="/login">
                {messages.common.logIn}
              </Link>
            </>
          }
        />
      </PageContainer>

      <section aria-labelledby="available-services-title">
        <PageContainer className="space-y-8 py-12 sm:py-16 lg:py-20">
          <SectionHeader
            id="available-services-title"
            title={landing.servicesTitle}
            description={landing.servicesDescription}
            align="center"
            contentClassName="lg:max-w-none"
            descriptionClassName="lg:whitespace-nowrap"
          />
          {services.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {services.map((service) => {
                const copy = getServiceCopy(service.serviceKey, messages.services);
                return (
                  <ServiceCard
                    key={service.serviceKey}
                    serviceKey={service.serviceKey}
                    name={copy.name}
                    description={copy.description}
                    availabilityLabel={messages.services.availableStatus}
                    action={
                      <Link className={buttonVariants({ size: "lg" })} href="/login?returnTo=/services">
                        {messages.common.continue}<ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    }
                  />
                );
              })}
            </div>
          ) : (
            <Card variant="muted">
              <CardContent className="pt-5 text-center text-sm leading-6 text-muted-foreground sm:pt-6">
                {landing.servicesUnavailable}
              </CardContent>
            </Card>
          )}
          <div className="flex justify-center">
            <Link className={buttonVariants({ variant: "outline" })} href="/services">
              {landing.allServicesAction}<ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-border bg-surface-muted" aria-labelledby="how-it-works-title">
        <PageContainer className="space-y-8 py-12 sm:py-16 lg:py-20">
          <SectionHeader
            id="how-it-works-title"
            title={landing.howItWorksTitle}
            description={landing.howItWorksDescription}
            align="center"
            contentClassName="lg:max-w-none"
            descriptionClassName="lg:whitespace-nowrap"
          />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step}>
                <Card className="h-full border-primary/10 bg-card/80">
                  <CardContent className="space-y-4 pt-5 text-center sm:pt-6">
                    <span className="mx-auto grid size-9 place-items-center rounded-pill bg-secondary text-sm font-bold text-primary" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="font-semibold leading-6 text-foreground">{step}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

      <section aria-labelledby="benefits-title">
        <PageContainer className="space-y-8 py-12 sm:py-16 lg:py-20">
          <SectionHeader
            id="benefits-title"
            title={landing.benefitsTitle}
            description={landing.benefitsDescription}
            align="center"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {strengths.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="h-full border-primary/10">
                <CardContent className="space-y-4 pt-5 text-center sm:pt-6">
                  <IconTile className="mx-auto" tone="neutral"><Icon aria-hidden="true" /></IconTile>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold leading-snug">{title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
