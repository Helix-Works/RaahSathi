"use client";

import type { IdentityContext, IdentityOutcome } from "@raahsathi/contracts/identity";
import { FileCheck2, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/shared/state-presentations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { retryIdentity, startIdentity } from "@/features/identity/api";
import type { Locale } from "@/i18n";

const copy = {
  en: {
    title: "Synthetic identity verification",
    description: "RaahSathi sends synthetic metadata to a simulated provider. No real document is uploaded or stored.",
    start: "Start synthetic verification",
    retry: "Retry safely",
    pending: "Checking synthetic identity",
    documents: "Synthetic document metadata",
    identityProof: "Identity proof metadata",
    addressProof: "Address proof metadata",
    reference: "Synthetic reference",
    error: "Identity verification could not be updated. Your completed application sections remain safe.",
    outcomeLabels: {
      VERIFIED: "Verified",
      OTP_INVALID: "OTP rejected",
      USER_MISMATCH: "Review required",
      TIMEOUT: "Timed out",
      PROVIDER_UNAVAILABLE: "Provider unavailable",
      RETRY_REQUIRED: "Retry required",
    },
    outcomes: {
      VERIFIED: "Identity verified. Your application is ready for the payment phase.",
      OTP_INVALID: "The simulated provider rejected the OTP. Retry without re-entering application details.",
      USER_MISMATCH: "The simulated identity does not match this application. Review is required before continuing.",
      TIMEOUT: "The simulated provider timed out. Your progress is safe and this attempt can be retried.",
      PROVIDER_UNAVAILABLE: "The simulated provider is unavailable. Your progress is safe and this attempt can be retried.",
      RETRY_REQUIRED: "The simulated provider requires a fresh attempt. Your completed sections remain saved.",
    },
  },
  hi: {
    title: "कृत्रिम पहचान सत्यापन",
    description: "राहसाथी केवल कृत्रिम मेटाडेटा एक नकली प्रदाता को भेजता है। कोई वास्तविक दस्तावेज़ अपलोड या संग्रहीत नहीं होता।",
    start: "कृत्रिम सत्यापन शुरू करें",
    retry: "सुरक्षित रूप से फिर प्रयास करें",
    pending: "कृत्रिम पहचान जाँची जा रही है",
    documents: "कृत्रिम दस्तावेज़ मेटाडेटा",
    identityProof: "पहचान प्रमाण मेटाडेटा",
    addressProof: "पता प्रमाण मेटाडेटा",
    reference: "कृत्रिम संदर्भ",
    error: "पहचान सत्यापन अपडेट नहीं हो सका। आपके पूरे किए गए आवेदन भाग सुरक्षित हैं।",
    outcomeLabels: {
      VERIFIED: "सत्यापित",
      OTP_INVALID: "ओटीपी अस्वीकृत",
      USER_MISMATCH: "समीक्षा आवश्यक",
      TIMEOUT: "समय समाप्त",
      PROVIDER_UNAVAILABLE: "प्रदाता अनुपलब्ध",
      RETRY_REQUIRED: "पुनः प्रयास आवश्यक",
    },
    outcomes: {
      VERIFIED: "पहचान सत्यापित हो गई। आपका आवेदन भुगतान चरण के लिए तैयार है।",
      OTP_INVALID: "नकली प्रदाता ने ओटीपी अस्वीकार किया। आवेदन विवरण दोबारा भरे बिना फिर प्रयास करें।",
      USER_MISMATCH: "कृत्रिम पहचान इस आवेदन से मेल नहीं खाती। आगे बढ़ने से पहले समीक्षा आवश्यक है।",
      TIMEOUT: "नकली प्रदाता का समय समाप्त हो गया। आपकी प्रगति सुरक्षित है और फिर प्रयास किया जा सकता है।",
      PROVIDER_UNAVAILABLE: "नकली प्रदाता उपलब्ध नहीं है। आपकी प्रगति सुरक्षित है और फिर प्रयास किया जा सकता है।",
      RETRY_REQUIRED: "नकली प्रदाता को नया प्रयास चाहिए। आपके पूरे किए गए भाग सुरक्षित हैं।",
    },
  },
} as const;

function outcomeTone(outcome: IdentityOutcome): "success" | "warning" | "neutral" {
  return outcome === "VERIFIED" ? "success" : outcome === "USER_MISMATCH" ? "neutral" : "warning";
}

export function IdentityRecoveryPanel({ applicationId, initialContext, locale }: Readonly<{
  applicationId: string;
  initialContext: IdentityContext;
  locale: Locale;
}>) {
  const messages = copy[locale];
  const [context, setContext] = useState(initialContext);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async (action: "start" | "retry") => {
    setPending(true);
    setFailed(false);
    try {
      const updated = action === "start" || !context.attempt
        ? await startIdentity(applicationId)
        : await retryIdentity(applicationId, context.attempt.id);
      setContext(updated);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">{messages.title}</h2>
          {context.attempt ? <StatusBadge tone={outcomeTone(context.attempt.outcome)}>{messages.outcomeLabels[context.attempt.outcome]}</StatusBadge> : null}
        </div>
        <p className="leading-7 text-muted-foreground">{messages.description}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {context.attempt ? <p role="status" className="rounded-xl border bg-muted/40 p-4 font-semibold">{messages.outcomes[context.attempt.outcome]}</p> : null}
        {failed ? <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm font-semibold text-destructive">{messages.error}</p> : null}
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
