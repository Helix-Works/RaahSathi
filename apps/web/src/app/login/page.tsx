import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="grid overflow-hidden border border-border-strong bg-card lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="bg-primary p-6 text-primary-foreground sm:p-8 lg:p-10">
          <div className="[&_.eyebrow]:text-primary-foreground/60 [&_h1]:text-primary-foreground [&_p]:text-primary-foreground/75">
            <PageHeader
              eyebrow={messages.auth.eyebrow}
              title={messages.auth.title}
              description={messages.auth.description}
            />
          </div>
          <ol className="mt-8 grid gap-0 border-t border-primary-foreground/25">
            {[
              messages.landing.recoveryTitle,
              messages.landing.statusTitle,
              messages.landing.languageTitle,
            ].map((item, index) => (
              <li key={item} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-primary-foreground/25 py-3 text-sm font-bold leading-6">
                <span className="text-primary-foreground/55" aria-hidden="true">0{index + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </aside>
        <div className="p-5 sm:p-7 lg:p-8">
          <LoginFlow messages={messages} returnTo={returnTo} locale={locale} />
        </div>
      </div>
    </div>
  );
}
