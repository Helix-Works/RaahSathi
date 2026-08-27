import { redirect } from "next/navigation";

import { JourneyIllustration } from "@/components/brand/journey-illustration";
import { IconTile } from "@/components/shared/icon-tile";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { PrototypeDisclosure } from "@/components/shared/prototype-disclosure";
import { LoginFlow } from "@/features/auth/components/login-flow";
import { getSafeReturnPath } from "@/features/auth/safe-return-path";
import { getShellSession } from "@/features/auth/session";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";

type LoginPageProps = Readonly<{
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  const session = await getShellSession();
  const query = await searchParams;
  const returnTo = getSafeReturnPath(query.returnTo);

  if (session.kind === "authenticated") {
    redirect(returnTo);
  }

  return (
    <PageContainer className="max-w-6xl py-10 sm:py-12 lg:py-16">
      <div className="grid overflow-hidden rounded-feature border border-border bg-card shadow-subtle lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative overflow-hidden border-b border-border bg-surface-muted p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <div className="relative space-y-8">
            <PageHeader
              eyebrow={messages.auth.eyebrow}
              title={messages.auth.title}
              description={messages.auth.description}
            />
            <ol className="grid gap-3" aria-label={messages.auth.benefitsLabel}>
            {[
              messages.auth.benefitRecovery,
              messages.auth.benefitStatus,
              messages.auth.benefitLanguage,
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-item border border-primary/15 bg-card/70 p-3 text-sm font-semibold leading-6 text-secondary-foreground">
                <IconTile size="sm"><span className="text-xs font-bold">✓</span></IconTile>
                <span>{item}</span>
              </li>
            ))}
            </ol>
            <JourneyIllustration className="mx-auto max-w-md" />
          </div>
        </aside>
        <div className="space-y-6 p-5 sm:p-7 lg:p-10">
          <div className="max-w-md">
            <LoginFlow messages={messages} returnTo={returnTo} locale={locale} />
          </div>
          <PrototypeDisclosure title={messages.disclosure.title} description={messages.disclosure.description} />
        </div>
      </div>
    </PageContainer>
  );
}
