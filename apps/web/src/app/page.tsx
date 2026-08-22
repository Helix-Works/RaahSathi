import {
  CalendarDays,
  CheckCircle2,
  Languages,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { NextActionCard } from "@/components/shared/state-presentations";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";

export default async function Home() {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  const landing = messages.landing;
  const benefits = [
    {
      title: landing.recoveryTitle,
      description: landing.recoveryDescription,
      icon: RotateCcw,
    },
    {
      title: landing.statusTitle,
      description: landing.statusDescription,
      icon: CheckCircle2,
    },
    {
      title: landing.appointmentsTitle,
      description: landing.appointmentsDescription,
      icon: CalendarDays,
    },
    {
      title: landing.languageTitle,
      description: landing.languageDescription,
      icon: Languages,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="space-y-7">
          <div className="space-y-5">
            <p className="eyebrow">{landing.eyebrow}</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.06em] text-balance sm:text-6xl lg:text-7xl">
              {landing.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {landing.tagline}
            </p>
          </div>

          <div className="flex flex-col gap-3 min-[390px]:flex-row">
            <Link className={buttonVariants({ size: "lg" })} href="/services">
              {messages.common.exploreServices}
            </Link>
            <Link
              className={buttonVariants({ variant: "outline", size: "lg" })}
              href="#benefits"
            >
              {messages.common.learnMore}
            </Link>
          </div>

          <p className="flex max-w-2xl items-start gap-2 text-sm leading-6 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {landing.heroNote}
          </p>
        </div>

        <Card className="relative overflow-hidden border-primary/20">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />
          <CardContent className="space-y-6 py-7 sm:py-8">
            <div className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
              <ShieldCheck className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <p className="text-lg font-black">{messages.disclosure.title}</p>
              <p className="leading-7 text-muted-foreground">
                {messages.disclosure.description}
              </p>
            </div>
            <div className="grid gap-3 text-sm font-bold sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <p className="rounded-xl bg-muted px-4 py-3">{landing.prototypeNotice}</p>
              <p className="rounded-xl bg-muted px-4 py-3">{landing.independenceNotice}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="benefits" className="scroll-mt-24 py-20" aria-labelledby="benefits-title">
        <div className="mb-8 max-w-2xl space-y-3">
          <h2 id="benefits-title" className="text-3xl font-black tracking-tight sm:text-4xl">
            {landing.benefitsTitle}
          </h2>
          <p className="leading-7 text-muted-foreground">{landing.benefitsDescription}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="h-full">
              <CardContent className="space-y-4 py-6">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold">{title}</h3>
                  <p className="leading-7 text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <NextActionCard
        title={landing.nextTitle}
        description={landing.nextDescription}
        actionLabel={messages.common.exploreServices}
        actionHref="/services"
      />
    </div>
  );
}
