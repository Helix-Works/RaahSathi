import type { ServiceSummary } from "@raahsathi/contracts";
import { ArrowRight, CalendarDays, CheckCircle2, Languages, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { JourneyIllustration } from "@/components/brand/journey-illustration";
import { IconTile } from "@/components/shared/icon-tile";
import { PageContainer } from "@/components/shared/page-container";
import { PrototypeDisclosure } from "@/components/shared/prototype-disclosure";
import { SectionHeader } from "@/components/shared/section-header";
import { ServiceCard } from "@/components/shared/service-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StartApplicationButton } from "@/features/applications/components/start-application-button";
import { getMockServices } from "@/features/services/api/mock";
import { getServiceCopy } from "@/features/services/presentation";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { dataSource } from "@/lib/data-source";
import { listAvailableServices } from "@/server/applications/service-catalogue";

export default async function Home() {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
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
      <section className="border-b border-border bg-surface" aria-labelledby="landing-title">
        <PageContainer className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.03fr_0.97fr] lg:gap-14 lg:py-20">
          <div className="space-y-7">
            <div className="space-y-4">
              <p className="eyebrow">{landing.eyebrow}</p>
              <h1 id="landing-title" className="max-w-3xl text-[clamp(2.25rem,4.25vw,3.35rem)] font-bold leading-[1.08] tracking-[-0.045em] text-balance">
                {landing.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                {landing.tagline}
              </p>
            </div>
            <div className="flex flex-col gap-3 min-[390px]:flex-row">
              <Link className={buttonVariants({ size: "lg" })} href="/services">
                {messages.common.exploreServices}<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/login">
                {messages.common.logIn}
              </Link>
            </div>
            <p className="flex max-w-2xl items-start gap-2.5 text-sm leading-6 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {landing.heroNote}
            </p>
            <div className="space-y-2.5">
              <PrototypeDisclosure title={messages.disclosure.title} description={messages.disclosure.description} />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold leading-5 text-muted-foreground">
                <span>{landing.prototypeNotice}</span>
                <span>{landing.independenceNotice}</span>
              </div>
            </div>
          </div>
          <div className="relative rounded-feature border border-primary/20 bg-surface-muted p-4 shadow-subtle sm:p-6">
            <div className="absolute inset-x-6 top-6 h-20 rounded-panel bg-accent/60 blur-2xl" aria-hidden="true" />
            <JourneyIllustration className="relative mx-auto max-w-[42rem]" />
          </div>
        </PageContainer>
      </section>

      <section aria-labelledby="available-services-title">
        <PageContainer className="space-y-8 py-14 sm:py-16 lg:py-20">
          <SectionHeader
            id="available-services-title"
            eyebrow={messages.services.eyebrow}
            title={landing.servicesTitle}
            description={landing.servicesDescription}
            action={<Link className={buttonVariants({ variant: "outline" })} href="/services">{landing.allServicesAction}<ArrowRight className="size-4" aria-hidden="true" /></Link>}
          />
          {services.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {services.map((service) => {
                const copy = getServiceCopy(service.serviceKey, messages.services);
                return <ServiceCard key={service.serviceKey} serviceKey={service.serviceKey} name={copy.name} description={copy.description} availabilityLabel={messages.services.availableStatus} action={<StartApplicationButton serviceKey={service.serviceKey} label={messages.common.continue} errorLabel={messages.services.startFailed} loginPath="/login?returnTo=/services" />} />;
              })}
            </div>
          ) : (
            <Card variant="muted"><CardContent className="pt-5 text-sm leading-6 text-muted-foreground sm:pt-6">{landing.servicesUnavailable}</CardContent></Card>
          )}
        </PageContainer>
      </section>

      <section className="border-y border-border bg-surface-muted" aria-labelledby="account-title">
        <PageContainer className="py-12 sm:py-14 lg:py-16">
          <Card variant="emphasized" className="overflow-hidden">
            <CardContent className="grid gap-6 pt-5 sm:pt-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <IconTile size="lg"><RotateCcw aria-hidden="true" /></IconTile>
              <div className="space-y-2"><h2 id="account-title" className="text-xl font-bold leading-snug tracking-[-0.025em] sm:text-2xl">{landing.accountTitle}</h2><p className="max-w-3xl leading-6 text-muted-foreground">{landing.accountDescription}</p></div>
              <Link className={buttonVariants({ variant: "outline" })} href="/login">{landing.accountAction}<ArrowRight className="size-4" aria-hidden="true" /></Link>
            </CardContent>
          </Card>
        </PageContainer>
      </section>

      <section aria-labelledby="how-it-works-title">
        <PageContainer className="space-y-8 py-14 sm:py-16 lg:py-20">
          <SectionHeader id="how-it-works-title" eyebrow={landing.howItWorksEyebrow} title={landing.howItWorksTitle} description={landing.howItWorksDescription} />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => <li key={step}><Card variant="muted" className="h-full"><CardContent className="space-y-4 pt-5 sm:pt-6"><span className="text-sm font-bold text-primary" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><p className="font-semibold leading-6 text-foreground">{step}</p></CardContent></Card></li>)}
          </ol>
        </PageContainer>
      </section>

      <section id="benefits" className="border-t border-border bg-surface" aria-labelledby="benefits-title">
        <PageContainer className="grid gap-9 py-14 sm:py-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14 lg:py-20">
          <div className="space-y-4 lg:sticky lg:top-28 lg:self-start"><p className="eyebrow">{landing.eyebrow}</p><h2 id="benefits-title" className="text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl">{landing.benefitsTitle}</h2><p className="max-w-xl leading-7 text-muted-foreground">{landing.benefitsDescription}</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {strengths.map(({ title, description, icon: Icon }) => <Card key={title} variant="default"><CardContent className="space-y-4 pt-5 sm:pt-6"><IconTile tone="neutral"><Icon aria-hidden="true" /></IconTile><div className="space-y-2"><h3 className="text-lg font-bold leading-snug">{title}</h3><p className="text-sm leading-6 text-muted-foreground">{description}</p></div></CardContent></Card>)}
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
