import Link from "next/link";

import { RaahSathiLogo } from "@/components/brand/raahsathi-logo";
import { PageContainer } from "@/components/shared/page-container";
import { PrototypeDisclosure } from "@/components/shared/prototype-disclosure";
import type { MessageDictionary } from "@/i18n";

export function AppFooter({ messages }: Readonly<{ messages: MessageDictionary }>) {
  return (
    <footer className="border-t border-surface-strong bg-surface-strong text-primary-foreground">
      <PageContainer className="grid gap-6 py-8 md:grid-cols-[0.8fr_auto_1.2fr] md:items-center">
        <div className="space-y-3">
          <Link
            href="/"
            className="brand-link inline-flex min-h-11 items-center rounded-control focus-visible:outline-brand-accent"
            data-tone="inverse"
            aria-label={`${messages.landing.name} · ${messages.navigation.home}`}
          >
            <RaahSathiLogo name={messages.landing.name} tone="inverse" />
          </Link>
          <p className="max-w-sm text-sm leading-6 text-primary-foreground/70">
            {messages.footer.tagline}
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-primary-foreground/75"
          aria-label={messages.footer.navigationLabel}
        >
          <Link className="inline-flex min-h-11 items-center hover:text-brand-accent" href="/">
            {messages.navigation.home}
          </Link>
          <Link className="inline-flex min-h-11 items-center hover:text-brand-accent" href="/services">
            {messages.navigation.services}
          </Link>
        </nav>
        <PrototypeDisclosure
          title={messages.disclosure.title}
          description={messages.disclosure.description}
          tone="inverse"
        />
      </PageContainer>
    </footer>
  );
}
