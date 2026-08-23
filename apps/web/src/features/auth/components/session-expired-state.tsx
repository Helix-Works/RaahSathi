import { ErrorState } from "@/components/shared/state-presentations";
import type { MessageDictionary } from "@/i18n";

export function SessionExpiredState({
  messages,
}: Readonly<{ messages: MessageDictionary }>) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <ErrorState
        title={messages.auth.sessionExpiredTitle}
        description={messages.auth.sessionExpiredDescription}
        retryLabel={messages.auth.reauthenticate}
        retryHref="/login?returnTo=/dashboard"
        headingLevel={1}
      />
    </div>
  );
}
