import { Clock3, FileText } from "lucide-react";
import type { ReactNode } from "react";

import { IconTile } from "@/components/shared/icon-tile";
import { StatusBadge } from "@/components/shared/state-presentations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardApplicationSummaryProps = Readonly<{
  title: string;
  serviceName: string;
  status: ReactNode;
  statusTone: "neutral" | "success" | "warning";
  updatedLabel: string;
  updatedValue: string;
}>;

export function DashboardApplicationSummary({
  title,
  serviceName,
  status,
  statusTone,
  updatedLabel,
  updatedValue,
}: DashboardApplicationSummaryProps) {
  return (
    <section aria-labelledby="active-application-title">
      <Card className="h-full overflow-hidden">
        <CardHeader className="border-b border-border bg-surface-muted">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconTile size="sm">
                <FileText aria-hidden="true" />
              </IconTile>
              <p className="text-sm font-semibold text-secondary-foreground">{title}</p>
            </div>
            <StatusBadge tone={statusTone}>{status}</StatusBadge>
          </div>
          <div className="pt-1">
            <CardTitle id="active-application-title" className="text-2xl sm:text-3xl">
              {serviceName}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5 sm:pt-6">
          <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
            <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{updatedLabel}: {updatedValue}</span>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
