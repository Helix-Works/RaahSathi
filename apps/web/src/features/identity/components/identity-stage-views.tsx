import type { IdentityContext, IdentityOutcome } from "@raahsathi/contracts/identity";
import { FileCheck2, ShieldCheck } from "lucide-react";

import { DefinitionGrid, DefinitionItem } from "@/components/shared/journey-stage";
import { IconTile } from "@/components/shared/icon-tile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { displayReference } from "@/lib/display-reference";

type OutcomeTone = "success" | "warning" | "neutral";

export function IdentityOutcomeView({
  outcome,
  label,
  description,
}: Readonly<{
  outcome: IdentityOutcome;
  label: string;
  description: string;
}>) {
  const tone: OutcomeTone = outcome === "VERIFIED"
    ? "success"
    : outcome === "USER_MISMATCH"
      ? "neutral"
      : "warning";
  const variant = tone === "success" ? "success" : tone === "warning" ? "warning" : "info";

  return (
    <Alert variant={variant} role="status" aria-live="polite" className="flex items-start gap-3">
      <IconTile size="sm" tone={tone === "neutral" ? "neutral" : tone}>
        <ShieldCheck aria-hidden="true" />
      </IconTile>
      <div className="min-w-0 space-y-1">
        <AlertTitle>{label}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>
    </Alert>
  );
}

export function DocumentMetadata({
  documents,
  title,
  identityProofLabel,
  addressProofLabel,
  referenceLabel,
}: Readonly<{
  documents: IdentityContext["documents"];
  title: string;
  identityProofLabel: string;
  addressProofLabel: string;
  referenceLabel: string;
}>) {
  if (documents.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="document-details-title">
      <h3 id="document-details-title" className="text-base font-bold">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {documents.map((document) => (
          <div key={document.id} className="rounded-item border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <IconTile size="sm" tone="default">
                <FileCheck2 aria-hidden="true" />
              </IconTile>
              <p className="pt-1 font-semibold leading-6">
                {document.kind === "SYNTHETIC_IDENTITY_PROOF" ? identityProofLabel : addressProofLabel}
              </p>
            </div>
            <DefinitionGrid className="mt-3 grid-cols-1 sm:grid-cols-1">
              <DefinitionItem label={referenceLabel}>
                <span className="break-all font-mono text-sm font-medium">{displayReference(document.syntheticReference)}</span>
              </DefinitionItem>
            </DefinitionGrid>
          </div>
        ))}
      </div>
    </section>
  );
}
