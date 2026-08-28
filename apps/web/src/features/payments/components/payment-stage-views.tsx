import type { PaymentContext, PaymentStatus } from "@raahsathi/contracts/payments";
import { CheckCircle2, Clock3, Landmark, TriangleAlert } from "lucide-react";

import { DefinitionGrid, DefinitionItem } from "@/components/shared/journey-stage";
import { IconTile } from "@/components/shared/icon-tile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { displayReference } from "@/lib/display-reference";

type PaymentMessages = Readonly<{
  baseFee: string;
  serviceCharge: string;
  total: string;
  reference: string;
  attempt: string;
  statuses: Readonly<Record<PaymentStatus, string>>;
  explanations: Readonly<Record<PaymentStatus, string>>;
  notStarted: string;
}>;

function statusPresentation(status: PaymentStatus) {
  if (status === "SUCCEEDED") return { icon: CheckCircle2, tone: "success" as const, variant: "success" as const };
  if (status === "PENDING") return { icon: Clock3, tone: "warning" as const, variant: "warning" as const };
  return { icon: TriangleAlert, tone: "destructive" as const, variant: "error" as const };
}

export function FeeSummary({ context, money, messages }: Readonly<{
  context: PaymentContext;
  money: Intl.NumberFormat;
  messages: PaymentMessages;
}>) {
  return (
    <section aria-labelledby="payment-fee-summary-title" className="space-y-3">
      <div className="flex items-center gap-3">
        <IconTile size="sm" tone="default"><Landmark aria-hidden="true" /></IconTile>
        <h3 id="payment-fee-summary-title" className="text-base font-bold">{messages.total}</h3>
      </div>
      <DefinitionGrid className="sm:grid-cols-3">
        <DefinitionItem label={messages.baseFee}>{money.format(context.fee.baseFeeMinor / 100)}</DefinitionItem>
        <DefinitionItem label={messages.serviceCharge}>{money.format(context.fee.serviceChargeMinor / 100)}</DefinitionItem>
        <DefinitionItem label={messages.total}>{money.format(context.fee.totalAmountMinor / 100)}</DefinitionItem>
      </DefinitionGrid>
    </section>
  );
}

export function PaymentStatusView({ status, messages }: Readonly<{
  status?: PaymentStatus;
  messages: PaymentMessages;
}>) {
  if (!status) {
    return (
      <Alert variant="info" role="status" className="flex items-start gap-3">
        <IconTile size="sm" tone="default"><Landmark aria-hidden="true" /></IconTile>
        <div className="min-w-0"><AlertDescription>{messages.notStarted}</AlertDescription></div>
      </Alert>
    );
  }

  const presentation = statusPresentation(status);
  const Icon = presentation.icon;
  return (
    <Alert variant={presentation.variant} role="status" aria-live="polite" className="flex items-start gap-3">
      <IconTile size="sm" tone={presentation.tone}><Icon aria-hidden="true" /></IconTile>
      <div className="min-w-0 space-y-1">
        <AlertTitle>{messages.statuses[status]}</AlertTitle>
        <AlertDescription>{messages.explanations[status]}</AlertDescription>
      </div>
    </Alert>
  );
}

export function PaymentAttemptMetadata({
  context,
  attemptLabel,
  referenceLabel,
  formattedAttempt,
}: Readonly<{
  context: PaymentContext;
  attemptLabel: string;
  referenceLabel: string;
  formattedAttempt: string;
}>) {
  if (!context.attempt) return null;
  return (
    <DefinitionGrid>
      <DefinitionItem label={referenceLabel}>
        <span className="break-all font-mono text-sm font-medium">{displayReference(context.attempt.providerReference)}</span>
      </DefinitionItem>
      <DefinitionItem label={attemptLabel}>{formattedAttempt}</DefinitionItem>
    </DefinitionGrid>
  );
}
