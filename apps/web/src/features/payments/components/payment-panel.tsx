"use client";

import type { PaymentContext, PaymentStatus } from "@raahsathi/contracts/payments";
import { CreditCard, Landmark, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { JourneyStageHeader, StageActionPanel } from "@/components/shared/journey-stage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { refreshPayment, startPayment } from "@/features/payments/api";
import {
  getPaymentErrorPresentation,
  type PaymentErrorPresentation,
} from "@/features/payments/payment-errors";
import {
  beginPaymentOperation,
  endPaymentOperation,
  getOrCreatePaymentInitiation,
  synchronizePaymentResponse,
  type PaymentInitiation,
} from "@/features/payments/payment-flow";
import { FeeSummary, PaymentAttemptMetadata, PaymentStatusView } from "@/features/payments/components/payment-stage-views";
import type { Locale, MessageDictionary } from "@/i18n";

function statusTone(status: PaymentStatus): "error" | "success" | "warning" {
  if (status === "SUCCEEDED") return "success";
  if (status === "FAILED") return "error";
  return "warning";
}

export function PaymentPanel({
  initialContext,
  locale,
  messages,
  onApplicationChanged,
}: Readonly<{
  initialContext: PaymentContext;
  locale: Locale;
  messages: MessageDictionary["payments"];
  onApplicationChanged: () => Promise<void>;
}>) {
  const router = useRouter();
  const [context, setContext] = useState(initialContext);
  const [pendingAction, setPendingAction] = useState<"refresh" | "start">();
  const [error, setError] = useState<PaymentErrorPresentation>();
  const errorRef = useRef<HTMLDivElement>(null);
  const initiationRef = useRef<PaymentInitiation | undefined>(undefined);
  const operationLock = useRef(false);
  const money = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    style: "currency",
    currency: context.fee.currency,
  });

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const update = async (action: "start" | "refresh") => {
    if (!beginPaymentOperation(operationLock)) return;
    setPendingAction(action);
    setError(undefined);
    try {
      let updated: PaymentContext;
      if (action === "refresh" && context.attempt) {
        updated = await refreshPayment(context.attempt.id);
      } else {
        const initiation = getOrCreatePaymentInitiation(
          initiationRef.current,
          context.applicationId,
        );
        initiationRef.current = initiation;
        updated = await startPayment(context.applicationId, initiation.idempotencyKey);
        initiationRef.current = undefined;
      }
      try {
        await synchronizePaymentResponse(updated, setContext, onApplicationChanged);
      } catch {
        setError({ message: messages.applicationRefreshError, action: "reload" });
      }
    } catch (reason: unknown) {
      const presentation = getPaymentErrorPresentation(reason, messages);
      if (presentation.discardInitiation) initiationRef.current = undefined;
      setError(presentation);
    } finally {
      setPendingAction(undefined);
      endPaymentOperation(operationLock);
    }
  };

  const status = context.attempt?.status;
  const paymentActionBlocked = error?.blocksPaymentAction === true;
  const actionLabel = pendingAction
    ? pendingAction === "refresh" ? messages.refreshing : messages.starting
    : status === "PENDING"
      ? messages.refresh
      : error?.retrySameInitiation
        ? messages.retryRequest
        : status === "FAILED" || status === "PROVIDER_UNAVAILABLE"
          ? messages.newAttempt
          : messages.pay;

  return <Card>
    <JourneyStageHeader
      title={messages.title}
      description={messages.description}
      icon={Landmark}
      status={status ? { label: messages.statuses[status], tone: statusTone(status) } : undefined}
    />
    <CardContent className="space-y-5 pt-5 sm:pt-6">
      <FeeSummary context={context} money={money} messages={messages} />
      <PaymentStatusView status={status} messages={messages} />
      <PaymentAttemptMetadata
        context={context}
        referenceLabel={messages.reference}
        attemptLabel={messages.attempt}
        formattedAttempt={context.attempt ? new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(context.attempt.attemptNumber) : ""}
      />
      {error ? (
        <div ref={errorRef} tabIndex={-1}>
          <Alert variant="error" role="alert">
            <AlertTitle>{messages.errorTitle}</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
            {error.correlationId ? (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {messages.referenceLabel}: {error.correlationId}
              </p>
            ) : null}
            {error.action ? (
              <Button
                className="mt-3"
                type="button"
                variant="outline"
                onClick={() => {
                  if (error.action === "reload") {
                    window.location.reload();
                    return;
                  }
                  router.push(`/login?returnTo=${encodeURIComponent(`/applications/${context.applicationId}`)}`);
                }}
              >
                {error.action === "reload" ? messages.reloadLatest : messages.signInAgain}
              </Button>
            ) : null}
          </Alert>
        </div>
      ) : null}
      {status === "SUCCEEDED" ? (
        <Alert variant="success" role="status"><AlertDescription>{messages.readyForAppointment}</AlertDescription></Alert>
      ) : paymentActionBlocked ? null : (
        <StageActionPanel><Button
          type="button"
          disabled={Boolean(pendingAction)}
          aria-busy={Boolean(pendingAction)}
          onClick={() => update(status === "PENDING" ? "refresh" : "start")}
        >
          {pendingAction ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : status === "PENDING" ? <RefreshCw className="size-4" aria-hidden="true" /> : <CreditCard className="size-4" aria-hidden="true" />}
          {actionLabel}
        </Button></StageActionPanel>
      )}
    </CardContent>
  </Card>;
}
