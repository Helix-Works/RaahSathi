import type { ServiceKey } from "@raahsathi/contracts";
import { BookOpenCheck, CarFront, CheckCircle2, MapPinned, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { IconTile } from "@/components/shared/icon-tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ServiceCardProps = Readonly<{
  serviceKey: ServiceKey;
  name: string;
  description?: string;
  availabilityLabel: string;
  action: ReactNode;
  compact?: boolean;
}>;

function ServiceIcon({ serviceKey }: Readonly<{ serviceKey: ServiceKey }>) {
  switch (serviceKey) {
    case "LEARNER_LICENCE":
      return <BookOpenCheck aria-hidden="true" />;
    case "PERMANENT_DRIVING_LICENCE":
      return <CarFront aria-hidden="true" />;
    case "DRIVING_LICENCE_RENEWAL":
      return <RefreshCw aria-hidden="true" />;
    case "DRIVING_LICENCE_ADDRESS_CHANGE":
      return <MapPinned aria-hidden="true" />;
  }
}

export function ServiceCard({
  serviceKey,
  name,
  description,
  availabilityLabel,
  action,
  compact = false,
}: ServiceCardProps) {
  return (
    <Card variant="service" className="h-full">
      <CardContent className={cn("flex h-full flex-col", compact ? "gap-3 p-4" : "gap-5 pt-5 sm:pt-6")}>
        <div className="flex items-start justify-between gap-4">
          <IconTile size={compact ? "sm" : "lg"}>
            <ServiceIcon serviceKey={serviceKey} />
          </IconTile>
          <Badge variant="success">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            {availabilityLabel}
          </Badge>
        </div>
        <div className={cn("min-w-0", description ? "space-y-2.5" : undefined)}>
          <h2 className={cn("font-bold leading-snug tracking-[-0.025em]", compact ? "text-lg" : "text-xl sm:text-2xl")}>
            {name}
          </h2>
          {description ? <p className="leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        <div className={cn("mt-auto", compact ? undefined : "pt-1")}>{action}</div>
      </CardContent>
    </Card>
  );
}
