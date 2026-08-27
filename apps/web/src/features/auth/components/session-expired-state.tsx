import { ErrorState } from "@/components/shared/state-presentations";
import { PageContainer } from "@/components/shared/page-container";
import type { MessageDictionary } from "@/i18n";

export function SessionExpiredState({
  messages,
}: Readonly<{ messages: MessageDictionary }>) {
  return (
    <PageContainer className="max-w-4xl py-10 sm:py-12 lg:py-14">
      <ErrorState
        title={messages.auth.sessionExpiredTitle}
        description={messages.auth.sessionExpiredDescription}
        retryLabel={messages.auth.reauthenticate}
        retryHref="/login?returnTo=/dashboard"
        headingLevel={1}
      />
    </PageContainer>
  );
}
