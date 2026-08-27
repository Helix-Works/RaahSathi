import { Clock3, FileText } from "lucide-react";
import type { ReactNode } from "react";

import { IconTile } from "@/components/shared/icon-tile";
import { StatusBadge } from "@/components/shared/state-presentations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type DashboardApplicationSummaryProps = Readonly<{
  title: string;
  serviceName: string;
  description: string;
  status: ReactNode;
  statusTone: "neutral" | "success" | "warning";
  progressLabel: string;
  progressValue: number;
  progressText: string;
  updatedLabel: string;
  updatedValue: string;
}>;

export function DashboardApplicationSummary({
  title,
  serviceName,
  description,
  status,
  statusTone,
  progressLabel,
  progressValue,
  progressText,
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
          <div className="space-y-2 pt-1">
            <CardTitle id="active-application-title" className="text-2xl sm:text-3xl">
              {serviceName}
            </CardTitle>
            <CardDescription className="max-w-2xl">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5 sm:pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span>{progressLabel}</span>
              <span>{progressText}</span>
            </div>
            <Progress value={progressValue} label={progressLabel} />
          </div>
          <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
            <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{updatedLabel}: {updatedValue}</span>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
