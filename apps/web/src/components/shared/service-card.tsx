import type { ServiceKey } from "@raahsathi/contracts";
import { BookOpenCheck, CarFront, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

import { IconTile } from "@/components/shared/icon-tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ServiceCardProps = Readonly<{
  serviceKey: ServiceKey;
  name: string;
  description: string;
  availabilityLabel: string;
  action: ReactNode;
}>;

function ServiceIcon({ serviceKey }: Readonly<{ serviceKey: ServiceKey }>) {
  switch (serviceKey) {
    case "LEARNER_LICENCE":
      return <BookOpenCheck aria-hidden="true" />;
    case "PERMANENT_DRIVING_LICENCE":
      return <CarFront aria-hidden="true" />;
  }
}

export function ServiceCard({
  serviceKey,
  name,
  description,
  availabilityLabel,
  action,
}: ServiceCardProps) {
  return (
    <Card variant="actionable" className="h-full">
      <CardContent className="flex h-full flex-col gap-5 pt-5 sm:pt-6">
        <div className="flex items-start justify-between gap-4">
          <IconTile size="lg">
            <ServiceIcon serviceKey={serviceKey} />
          </IconTile>
          <Badge variant="success">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            {availabilityLabel}
          </Badge>
        </div>
        <div className="space-y-2.5">
          <h2 className="text-xl font-bold leading-snug tracking-[-0.025em] sm:text-2xl">
            {name}
          </h2>
          <p className="leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="mt-auto pt-1">{action}</div>
      </CardContent>
    </Card>
  );
}
