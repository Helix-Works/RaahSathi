import { PrototypeDisclosure } from "@/components/shared/prototype-disclosure";
import type { MessageDictionary } from "@/i18n";

export function AppFooter({ messages }: Readonly<{ messages: MessageDictionary }>) {
  return (
    <footer className="border-t border-primary-foreground/20 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-[80rem] gap-6 px-4 py-8 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:px-8">
        <div className="space-y-2">
          <p className="text-lg font-black tracking-tight">{messages.landing.name}</p>
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
