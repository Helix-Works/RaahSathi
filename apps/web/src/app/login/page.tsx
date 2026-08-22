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
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14 lg:px-8">
      <div className="lg:sticky lg:top-28">
        <PageHeader
          eyebrow={messages.auth.eyebrow}
          title={messages.auth.title}
          description={messages.auth.description}
        />
      </div>
      <LoginFlow messages={messages} returnTo={returnTo} locale={locale} />
    </div>
  );
}
