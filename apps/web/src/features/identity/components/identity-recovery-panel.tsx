"use client";

import type { IdentityContext, IdentityOutcome } from "@raahsathi/contracts/identity";
import { FileCheck2, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/shared/state-presentations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { retryIdentity, startIdentity } from "@/features/identity/api";
import type { MessageDictionary } from "@/i18n";

function outcomeTone(outcome: IdentityOutcome): "success" | "warning" | "neutral" {
  return outcome === "VERIFIED" ? "success" : outcome === "USER_MISMATCH" ? "neutral" : "warning";
}

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
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">{messages.title}</h2>
          {context.attempt ? <StatusBadge tone={outcomeTone(context.attempt.outcome)}>{outcomeLabels[context.attempt.outcome]}</StatusBadge> : null}
        </div>
        <p className="leading-7 text-muted-foreground">{messages.description}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {context.attempt ? <p role="status" className="rounded-xl border bg-muted/40 p-4 font-semibold">{outcomes[context.attempt.outcome]}</p> : null}
        {failure ? <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm font-semibold text-destructive">{failure === "refresh" ? messages.refreshError : messages.genericError}</p> : null}
        {context.documents.length > 0 ? (
          <section className="space-y-3" aria-labelledby="synthetic-documents-title">
            <h3 id="synthetic-documents-title" className="font-black">{messages.documents}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {context.documents.map((document) => (
                <div key={document.id} className="rounded-xl border p-4">
                  <FileCheck2 className="mb-3 size-5 text-primary" aria-hidden="true" />
                  <p className="font-bold">{document.kind === "SYNTHETIC_IDENTITY_PROOF" ? messages.identityProof : messages.addressProof}</p>
                  <p className="mt-1 break-all text-sm text-muted-foreground">{messages.reference}: {document.syntheticReference}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {!context.attempt ? (
          <Button type="button" disabled={pending} onClick={() => run("start")}>
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
            {pending ? messages.pending : messages.start}
          </Button>
        ) : context.attempt.retryable ? (
          <Button type="button" disabled={pending} onClick={() => run("retry")}>
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            {pending ? messages.pending : messages.retry}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
