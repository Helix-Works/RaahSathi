import { redirect } from "next/navigation";
import { Check, Clock3, ShieldCheck } from "lucide-react";

import { IconTile } from "@/components/shared/icon-tile";
import { PageContainer } from "@/components/shared/page-container";
import { LoginFlow } from "@/features/auth/components/login-flow";
import { getSafeReturnPath } from "@/features/auth/safe-return-path";
import { getShellSession } from "@/features/auth/session";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";
import { getReviewerLoginHint } from "@/server/auth/reviewer-login-hint";

type LoginPageProps = Readonly<{
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [locale, session, query] = await Promise.all([
    getRequestLocale(),
    getShellSession(),
    searchParams,
  ]);
  const messages = getDictionary(locale);
  const returnTo = getSafeReturnPath(query.returnTo);
  const reviewerHint = getReviewerLoginHint(locale);

  if (session.kind === "authenticated") {
    redirect(returnTo);
  }

  return (
    <PageContainer className="max-w-[78rem] py-8 sm:py-10 lg:py-14">
      <div className="grid overflow-hidden rounded-feature border border-primary/15 bg-secondary shadow-elevated lg:min-h-[38rem] lg:grid-cols-[1.04fr_0.96fr]">
        <aside className="border-b border-primary/10 p-6 sm:p-9 lg:flex lg:items-center lg:border-b-0 lg:border-r lg:p-12">
          <div className="max-w-lg space-y-7">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-control border border-primary/10 bg-secondary px-3 text-sm font-bold text-primary">
              <ShieldCheck className="size-5" aria-hidden="true" />
              {messages.auth.eyebrow}
            </span>
            <div className="space-y-5">
              <h1 className="max-w-md text-4xl font-bold leading-[1.06] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-[3.25rem]">
                {messages.auth.title}
              </h1>
              <p className="max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                {messages.auth.description}
              </p>
            </div>
            <ol className="grid gap-3" aria-label={messages.auth.benefitsLabel}>
              {[
                { title: messages.auth.benefitRecoveryTitle, description: messages.auth.benefitRecovery, icon: ShieldCheck },
                { title: messages.auth.benefitStatusTitle, description: messages.auth.benefitStatus, icon: Check },
                { title: messages.auth.benefitLanguageTitle, description: messages.auth.benefitLanguage, icon: Clock3 },
              ].map(({ title, description, icon: Icon }) => (
                <li key={title} className="flex items-start gap-3 rounded-item border border-primary/15 bg-card/85 p-3.5 shadow-subtle">
                  <IconTile size="sm" className="bg-secondary/80"><Icon aria-hidden="true" /></IconTile>
                  <div className="min-w-0 space-y-0.5">
                    <h2 className="text-sm font-bold leading-5 text-secondary-foreground">{title}</h2>
                    <p className="text-sm leading-5 text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
        <div className="flex p-5 sm:p-8 lg:items-center lg:p-10">
          <div className="w-full max-w-[33.5rem] lg:mx-auto">
            <LoginFlow messages={messages} returnTo={returnTo} locale={locale} reviewerHint={reviewerHint} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
