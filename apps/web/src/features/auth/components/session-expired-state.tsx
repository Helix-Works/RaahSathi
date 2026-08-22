import { ErrorState } from "@/components/shared/state-presentations";
import type { MessageDictionary } from "@/i18n";

export function SessionExpiredState({
  messages,
}: Readonly<{ messages: MessageDictionary }>) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
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
