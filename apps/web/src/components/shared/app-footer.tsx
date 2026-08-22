import { PrototypeDisclosure } from "@/components/shared/prototype-disclosure";
import type { MessageDictionary } from "@/i18n";

export function AppFooter({ messages }: Readonly<{ messages: MessageDictionary }>) {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:px-8">
        <div className="space-y-2">
          <p className="text-lg font-black">{messages.landing.name}</p>
          <p className="text-sm leading-6 text-muted-foreground">
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
