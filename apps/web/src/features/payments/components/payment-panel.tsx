"use client";

import type { PaymentContext, PaymentStatus } from "@raahsathi/contracts/payments";
import { CreditCard, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { StatusBadge } from "@/components/shared/state-presentations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <CardHeader className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black">{messages.title}</h2>
        {status ? <StatusBadge tone={statusTone(status)}>{messages.statuses[status]}</StatusBadge> : null}
      </div>
      <p className="leading-7 text-muted-foreground">{messages.description}</p>
    </CardHeader>
    <CardContent className="space-y-5">
      <dl className="grid gap-3 rounded-xl border p-4 sm:grid-cols-3">
        <div><dt className="text-sm text-muted-foreground">{messages.baseFee}</dt><dd className="font-black">{money.format(context.fee.baseFeeMinor / 100)}</dd></div>
        <div><dt className="text-sm text-muted-foreground">{messages.serviceCharge}</dt><dd className="font-black">{money.format(context.fee.serviceChargeMinor / 100)}</dd></div>
        <div><dt className="text-sm text-muted-foreground">{messages.total}</dt><dd className="font-black">{money.format(context.fee.totalAmountMinor / 100)}</dd></div>
      </dl>
      {status ? (
        <Alert variant={status === "SUCCEEDED" ? "success" : status === "FAILED" ? "error" : "warning"} role="status" aria-live="polite">
          <AlertTitle>{messages.statuses[status]}</AlertTitle>
          <AlertDescription>{messages.explanations[status]}</AlertDescription>
        </Alert>
      ) : (
        <p className="rounded-xl border bg-muted/40 p-4 font-semibold">{messages.notStarted}</p>
      )}
      {context.attempt ? (
        <dl className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">{messages.reference}</dt>
            <dd className="break-all font-mono text-sm font-semibold">{context.attempt.providerReference}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{messages.attempt}</dt>
            <dd className="font-semibold">{new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(context.attempt.attemptNumber)}</dd>
          </div>
        </dl>
      ) : null}
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
        <p className="font-semibold">{messages.readyForAppointment}</p>
      ) : paymentActionBlocked ? null : (
        <Button
          type="button"
          disabled={Boolean(pendingAction)}
          aria-busy={Boolean(pendingAction)}
          onClick={() => update(status === "PENDING" ? "refresh" : "start")}
        >
          {pendingAction ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : status === "PENDING" ? <RefreshCw className="size-4" aria-hidden="true" /> : <CreditCard className="size-4" aria-hidden="true" />}
          {actionLabel}
        </Button>
      )}
    </CardContent>
  </Card>;
}
