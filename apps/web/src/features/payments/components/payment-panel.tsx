"use client";

import type { PaymentContext, PaymentStatus } from "@raahsathi/contracts/payments";
import { CheckCircle2, CreditCard, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { StatusBadge } from "@/components/shared/state-presentations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { refreshPayment, startPayment } from "@/features/payments/api";
import type { Locale } from "@/i18n";

const copy = {
  en: {
    title: "Synthetic fee payment",
    description: "The server fixes the amount and reconciles signed simulated-provider results. Browser redirects never decide success.",
    baseFee: "Licence fee", serviceCharge: "Service charge", total: "Total", pay: "Pay synthetic fee",
    retry: "Retry payment", refresh: "Refresh status", pendingAction: "Updating payment", reference: "Synthetic payment reference",
    error: "Payment status could not be updated. Your application and fee snapshot remain safe.",
    statuses: {
      PENDING: "Waiting for provider result",
      SUCCEEDED: "Payment confirmed",
      FAILED: "Payment failed safely",
      PROVIDER_UNAVAILABLE: "Provider unavailable",
    },
    explanations: {
      PENDING: "The provider result has not arrived yet. You may leave this page and return later.",
      SUCCEEDED: "The signed provider result was applied exactly once. Continue to appointment selection in the next phase.",
      FAILED: "No success was recorded and your application was not advanced. You can retry safely.",
      PROVIDER_UNAVAILABLE: "The simulated provider could not start the payment. Your fee and application progress are preserved.",
    },
  },
  hi: {
    title: "कृत्रिम शुल्क भुगतान",
    description: "राशि सर्वर तय करता है और हस्ताक्षरित नकली प्रदाता परिणामों का मिलान करता है। ब्राउज़र रीडायरेक्ट सफलता तय नहीं करता।",
    baseFee: "लाइसेंस शुल्क", serviceCharge: "सेवा शुल्क", total: "कुल", pay: "कृत्रिम शुल्क भरें",
    retry: "भुगतान फिर करें", refresh: "स्थिति ताज़ा करें", pendingAction: "भुगतान अपडेट हो रहा है", reference: "कृत्रिम भुगतान संदर्भ",
    error: "भुगतान स्थिति अपडेट नहीं हो सकी। आपका आवेदन और शुल्क स्नैपशॉट सुरक्षित हैं।",
    statuses: {
      PENDING: "प्रदाता परिणाम की प्रतीक्षा",
      SUCCEEDED: "भुगतान की पुष्टि हुई",
      FAILED: "भुगतान सुरक्षित रूप से विफल",
      PROVIDER_UNAVAILABLE: "प्रदाता अनुपलब्ध",
    },
    explanations: {
      PENDING: "प्रदाता का परिणाम अभी नहीं आया है। आप यह पेज छोड़कर बाद में लौट सकते हैं।",
      SUCCEEDED: "हस्ताक्षरित प्रदाता परिणाम ठीक एक बार लागू हुआ। अगले चरण में अपॉइंटमेंट चयन जारी रखें।",
      FAILED: "कोई सफलता दर्ज नहीं हुई और आवेदन आगे नहीं बढ़ा। आप सुरक्षित रूप से फिर प्रयास कर सकते हैं।",
      PROVIDER_UNAVAILABLE: "नकली प्रदाता भुगतान शुरू नहीं कर सका। आपका शुल्क और आवेदन प्रगति सुरक्षित हैं।",
    },
  },
} as const;

function statusTone(status: PaymentStatus): "success" | "warning" | "neutral" {
  return status === "SUCCEEDED" ? "success" : status === "PENDING" ? "warning" : "neutral";
}

export function PaymentPanel({ initialContext, locale }: Readonly<{ initialContext: PaymentContext; locale: Locale }>) {
  const messages = copy[locale];
  const router = useRouter();
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
      if (updated.attempt?.status === "SUCCEEDED") router.refresh();
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
      {failed ? <p role="alert" className="text-sm font-semibold text-destructive">{messages.error}</p> : null}
      {status === "SUCCEEDED" ? <CheckCircle2 className="size-8 text-success" aria-hidden="true" /> : (
        <Button type="button" disabled={pending} onClick={() => update(status === "PENDING" ? "refresh" : "start")}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : status === "PENDING" ? <RefreshCw className="size-4" aria-hidden="true" /> : <CreditCard className="size-4" aria-hidden="true" />}
          {pending ? messages.pendingAction : status === "PENDING" ? messages.refresh : status ? messages.retry : messages.pay}
        </Button>
      )}
    </CardContent>
  </Card>;
}
