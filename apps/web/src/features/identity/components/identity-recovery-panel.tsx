"use client";

import type { IdentityContext, IdentityOutcome } from "@raahsathi/contracts/identity";
import { LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { JourneyStageHeader, StageActionPanel } from "@/components/shared/journey-stage";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { retryIdentity, startIdentity } from "@/features/identity/api";
import { IdentityOutcomeView, SyntheticDocumentMetadata } from "@/features/identity/components/identity-stage-views";
import type { MessageDictionary } from "@/i18n";

export function IdentityRecoveryPanel({ applicationId, initialContext, messages: dictionary, onApplicationChanged }: Readonly<{
  applicationId: string;
  initialContext: IdentityContext;
  messages: MessageDictionary;
  onApplicationChanged: () => Promise<void>;
}>) {
  const messages = dictionary.identity;
  const outcomeLabels: Readonly<Record<IdentityOutcome, string>> = {
    VERIFIED: messages.verified,
    OTP_INVALID: messages.otpInvalid,
    USER_MISMATCH: messages.userMismatch,
    TIMEOUT: messages.timeout,
    PROVIDER_UNAVAILABLE: messages.providerUnavailable,
    RETRY_REQUIRED: messages.retryRequired,
  };
  const outcomes: Readonly<Record<IdentityOutcome, string>> = {
    VERIFIED: messages.verifiedDescription,
    OTP_INVALID: messages.otpInvalidDescription,
    USER_MISMATCH: messages.userMismatchDescription,
    TIMEOUT: messages.timeoutDescription,
    PROVIDER_UNAVAILABLE: messages.providerUnavailableDescription,
    RETRY_REQUIRED: messages.retryRequiredDescription,
  };
  const [context, setContext] = useState(initialContext);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<"identity" | "refresh">();

  const run = async (action: "start" | "retry") => {
    setPending(true);
    setFailure(undefined);
    try {
      const updated = action === "start" || !context.attempt
        ? await startIdentity(applicationId)
        : await retryIdentity(applicationId, context.attempt.id);
      setContext(updated);
    } catch {
      setFailure("identity");
      setPending(false);
      return;
    }

    try {
      await onApplicationChanged();
    } catch {
      setFailure("refresh");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <JourneyStageHeader
        title={messages.title}
        description={messages.description}
        icon={ShieldCheck}
        status={context.attempt ? {
          label: outcomeLabels[context.attempt.outcome],
          tone: context.attempt.outcome === "VERIFIED" ? "success" : context.attempt.outcome === "USER_MISMATCH" ? "neutral" : "warning",
        } : undefined}
      />
      <CardContent className="space-y-5 pt-5 sm:pt-6">
        {context.attempt ? <IdentityOutcomeView outcome={context.attempt.outcome} label={outcomeLabels[context.attempt.outcome]} description={outcomes[context.attempt.outcome]} /> : null}
        {failure ? <Alert variant="error" role="alert"><AlertDescription>{failure === "refresh" ? messages.refreshError : messages.genericError}</AlertDescription></Alert> : null}
        <SyntheticDocumentMetadata
          documents={context.documents}
          title={messages.documents}
          identityProofLabel={messages.identityProof}
          addressProofLabel={messages.addressProof}
          referenceLabel={messages.reference}
        />
        {!context.attempt ? (
          <StageActionPanel><Button type="button" disabled={pending} aria-busy={pending} onClick={() => run("start")}>
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
            {pending ? messages.pending : messages.start}
          </Button></StageActionPanel>
        ) : context.attempt.retryable ? (
          <StageActionPanel><Button type="button" disabled={pending} aria-busy={pending} onClick={() => run("retry")}>
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            {pending ? messages.pending : messages.retry}
          </Button></StageActionPanel>
        ) : null}
      </CardContent>
    </Card>
  );
}
