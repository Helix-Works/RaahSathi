"use client";

import type { PaymentContext, PaymentStatus } from "@raahsathi/contracts/payments";
import { CheckCircle2, CreditCard, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/shared/state-presentations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { refreshPayment, startPayment } from "@/features/payments/api";
import type { Locale, MessageDictionary } from "@/i18n";

function statusTone(status: PaymentStatus): "success" | "warning" | "neutral" {
  return status === "SUCCEEDED" ? "success" : status === "PENDING" ? "warning" : "neutral";
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
  const [context, setContext] = useState(initialContext);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const money = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", { style: "currency", currency: "INR" });

  const update = async (action: "start" | "refresh") => {
    setPending(true);
    setFailed(false);
    try {
      const updated = action === "refresh" && context.attempt
        ? await refreshPayment(context.attempt.id)
        : await startPayment(context.applicationId, crypto.randomUUID());
      setContext(updated);
      if (updated.attempt?.status === "SUCCEEDED") await onApplicationChanged();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  const status = context.attempt?.status;
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
      {status ? <p role="status" className="rounded-xl bg-muted/50 p-4 font-semibold">{messages.explanations[status]}</p> : null}
      {context.attempt ? <p className="break-all text-sm text-muted-foreground">{messages.reference}: {context.attempt.providerReference}</p> : null}
      {failed ? <p role="alert" className="text-sm font-semibold text-destructive">{messages.updateError}</p> : null}
      {status === "SUCCEEDED" ? <CheckCircle2 className="size-8 text-success" aria-hidden="true" /> : (
        <Button type="button" disabled={pending} onClick={() => update(status === "PENDING" ? "refresh" : "start")}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : status === "PENDING" ? <RefreshCw className="size-4" aria-hidden="true" /> : <CreditCard className="size-4" aria-hidden="true" />}
          {pending ? messages.pendingAction : status === "PENDING" ? messages.refresh : status ? messages.retry : messages.pay}
        </Button>
      )}
    </CardContent>
  </Card>;
}
