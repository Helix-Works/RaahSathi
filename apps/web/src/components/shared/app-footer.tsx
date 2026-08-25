import Link from "next/link";

import { RaahSathiLogo } from "@/components/brand/raahsathi-logo";
import { PrototypeDisclosure } from "@/components/shared/prototype-disclosure";
import type { MessageDictionary } from "@/i18n";

export function AppFooter({ messages }: Readonly<{ messages: MessageDictionary }>) {
  return (
    <footer className="border-t border-primary-foreground/20 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-[80rem] gap-6 px-4 py-8 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:px-8">
        <div className="space-y-3">
          <Link
            href="/"
            className="brand-link inline-flex min-h-11 items-center rounded-xl focus-visible:outline-brand-accent"
            aria-label={`${messages.landing.name} · ${messages.navigation.home}`}
          >
            <RaahSathiLogo name={messages.landing.name} />
          </Link>
          <p className="max-w-sm text-sm leading-6 text-primary-foreground/70">
            {messages.footer.tagline}
          </p>
        </div>
        <PrototypeDisclosure
          title={messages.disclosure.title}
          description={messages.disclosure.description}
        />
      </div>
    </footer>
  );
}
