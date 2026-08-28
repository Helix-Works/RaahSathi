import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/page-container";
import { getDictionary } from "@/i18n";
import { getRequestLocale } from "@/i18n/locale";

export default async function NotFound() {
  const messages = getDictionary(await getRequestLocale());

  return (
    <PageContainer className="flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-6xl font-bold text-primary">404</p>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{messages.fallback.notFoundTitle}</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {messages.fallback.notFoundMessage}
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            {messages.fallback.home}
          </Link>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
