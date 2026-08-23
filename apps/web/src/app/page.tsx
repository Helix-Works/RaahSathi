import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Languages,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { NextActionCard } from "@/components/shared/state-presentations";
import { buttonVariants } from "@/components/ui/button";
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
  const actions = [
    {
      title: landing.applyTitle,
      description: landing.applyDescription,
      action: landing.applyAction,
      href: "/services",
      icon: FileText,
    },
    {
      title: landing.resumeTitle,
      description: landing.resumeDescription,
      action: landing.resumeAction,
      href: "/applications",
      icon: RotateCcw,
    },
    {
      title: landing.checkStatusTitle,
      description: landing.checkStatusDescription,
      action: landing.checkStatusAction,
      href: "/dashboard",
      icon: CheckCircle2,
    },
  ] as const;

  return (
    <div className="pb-16 sm:pb-20">
      <section className="border-b border-border bg-surface" aria-labelledby="landing-title">
        <div className="mx-auto grid max-w-[80rem] items-center gap-8 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-8 lg:pb-20 lg:pt-14">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="eyebrow">{landing.eyebrow}</p>
              <h1 id="landing-title" className="max-w-3xl text-[clamp(2.25rem,4.25vw,3.25rem)] font-black leading-[1.04] tracking-[-0.045em] text-balance">
                {landing.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                {landing.tagline}
              </p>
            </div>

            <div className="flex flex-col gap-3 min-[390px]:flex-row">
              <Link className={buttonVariants({ size: "lg" })} href="/services">
                {messages.common.exploreServices}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                className={buttonVariants({ variant: "outline", size: "lg" })}
                href="#benefits"
              >
                {messages.common.learnMore}
              </Link>
            </div>

            <p className="flex max-w-2xl items-start gap-2 border-l-2 border-foreground pl-4 text-sm leading-6 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" />
              {landing.heroNote}
            </p>
          </div>

          <div className="relative min-h-[21rem] overflow-hidden border border-foreground bg-primary p-5 text-primary-foreground sm:min-h-[23rem] sm:p-6" aria-hidden="true">
            <div className="relative flex h-full min-h-[18.5rem] flex-col justify-between sm:min-h-[20rem]">
              <div className="flex items-start justify-between gap-4 border-b border-primary-foreground/30 pb-4">
                <p className="max-w-48 text-xs font-black uppercase tracking-[0.16em] text-primary-foreground/70">
                  {landing.eyebrow}
                </p>
                <span className="text-xs font-bold">RS / 01</span>
              </div>

              <ol className="relative my-6 grid gap-3.5 pl-2 before:absolute before:bottom-5 before:left-[1.18rem] before:top-5 before:border-l before:border-primary-foreground/35">
                {[landing.recoveryTitle, landing.statusTitle, landing.appointmentsTitle].map((label, index) => (
                  <li key={label} className="relative grid grid-cols-[2.5rem_1fr] items-center gap-3">
                    <span className="z-10 grid size-9 place-items-center rounded-full border border-primary-foreground bg-primary text-xs font-black">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="border border-primary-foreground/25 bg-primary-foreground/5 px-4 py-3 text-sm font-bold leading-5">
                      {label}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="grid grid-cols-[auto_1fr] items-center gap-4 bg-primary-foreground p-4 text-primary">
                <span className="grid size-11 place-items-center border border-primary/25">
                  <FileText className="size-5" />
                </span>
                <p className="text-sm font-black leading-5">{landing.heroNote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-[80rem] px-4 sm:px-6 lg:px-8" aria-label={landing.primaryActionsLabel}>
        <div className="grid border border-border-strong bg-card lg:grid-cols-3">
          {actions.map(({ title, description, action, href, icon: Icon }, index) => (
            <Link
              key={title}
              className="group flex flex-col border-b border-border-strong p-5 transition-colors hover:bg-muted lg:border-b-0 lg:border-r lg:last:border-r-0 sm:p-6"
              href={href}
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <span className="grid size-11 place-items-center border border-foreground bg-primary text-primary-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-black text-muted-foreground">0{index + 1}</span>
              </div>
              <h2 className="text-xl font-black leading-snug tracking-tight">{title}</h2>
              <p className="mt-2.5 leading-6 text-muted-foreground">{description}</p>
              <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-black underline decoration-2 underline-offset-4">
                {action}
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <aside className="mx-auto mt-8 max-w-[80rem] px-4 sm:px-6 lg:px-8" aria-labelledby="landing-disclosure-title">
        <div className="grid gap-5 border border-foreground bg-secondary p-5 sm:grid-cols-[auto_1fr] sm:items-start sm:p-6">
          <ShieldCheck className="size-7" aria-hidden="true" />
          <div className="space-y-2">
            <h2 id="landing-disclosure-title" className="text-lg font-black">{messages.disclosure.title}</h2>
            <p className="max-w-4xl leading-7 text-muted-foreground">{messages.disclosure.description}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm font-extrabold">
              <span>{landing.prototypeNotice}</span>
              <span>{landing.independenceNotice}</span>
            </div>
          </div>
        </div>
      </aside>

      <section id="benefits" className="mx-auto grid max-w-[80rem] scroll-mt-20 gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12 lg:px-8 lg:py-20" aria-labelledby="benefits-title">
        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{landing.eyebrow}</p>
          <h2 id="benefits-title" className="text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl">
            {landing.benefitsTitle}
          </h2>
          <p className="max-w-xl leading-7 text-muted-foreground">{landing.benefitsDescription}</p>
        </div>

        <div className="border-t border-border-strong">
          {benefits.map(({ title, description, icon: Icon }, index) => (
            <article key={title} className="grid gap-4 border-b border-border-strong py-5 sm:grid-cols-[3rem_1fr] sm:py-6">
              <span className="grid size-10 place-items-center border border-border-strong bg-card">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="grid gap-2 md:grid-cols-[0.8fr_1.2fr] md:gap-8">
                <h3 className="text-xl font-black"><span className="mr-2 text-xs text-muted-foreground">0{index + 1}</span>{title}</h3>
                <p className="leading-6 text-muted-foreground">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <NextActionCard
          title={landing.nextTitle}
          description={landing.nextDescription}
          actionLabel={messages.common.exploreServices}
          actionHref="/services"
        />
      </div>
    </div>
  );
}
