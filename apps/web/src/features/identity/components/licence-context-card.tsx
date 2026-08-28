import type { LicenceRecordSummary } from "@raahsathi/contracts/identity";
import { IdCard } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Locale, MessageDictionary } from "@/i18n";

export function LicenceContextCard({ licences, locale, messages }: Readonly<{
  licences: readonly LicenceRecordSummary[];
  locale: Locale;
  messages: MessageDictionary["identity"]["licenceContext"];
}>) {
  if (licences.length === 0) return null;
  return (
    <Card>
      <CardHeader><h2 className="text-2xl font-black">{messages.title}</h2><p className="text-muted-foreground">{messages.description}</p></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {licences.map((licence) => (
          <div key={licence.id} className="rounded-xl border p-4">
            <IdCard className="mb-3 size-6 text-primary" aria-hidden="true" />
            <p className="font-black">{licence.kind === "PERMANENT" ? messages.permanent : messages.learner}</p>
            <p className="break-all text-sm text-muted-foreground">{licence.syntheticReference}</p>
            <p className="mt-2 text-sm">{messages.vehicle}: {licence.vehicleClass}</p>
            <p className="text-sm">{messages.validUntil}: {new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(licence.validUntil))}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
