import { BlockingReasonAlert } from "@/components/shared/blocking-reason-alert";
import { IconTile } from "@/components/shared/icon-tile";
import { StatusBadge } from "@/components/shared/state-presentations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText } from "lucide-react";

type ApplicationOverviewProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  serviceLabel: string;
  serviceName: string;
  statusLabel: string;
  status: string;
  progressLabel: string;
  progress: number;
  progressText: string;
  updatedLabel: string;
  updatedValue: string;
  nextActionLabel: string;
  nextAction: string;
  blocking?: Readonly<{ title: string; description: string }>;
}>;

export function ApplicationOverview({
  eyebrow,
  title,
  description,
  serviceLabel,
  serviceName,
  statusLabel,
  status,
  progressLabel,
  progress,
  progressText,
  updatedLabel,
  updatedValue,
  nextActionLabel,
  nextAction,
  blocking,
}: ApplicationOverviewProps) {
  return (
    <section aria-labelledby="application-overview-title" className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-surface-muted">
          <div className="flex items-start gap-3">
            <IconTile size="lg"><FileText aria-hidden="true" /></IconTile>
            <div className="min-w-0 space-y-2">
              <p className="eyebrow">{eyebrow}</p>
              <CardTitle id="application-overview-title" className="text-3xl sm:text-4xl">{title}</CardTitle>
              <CardDescription className="max-w-2xl">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-5 sm:pt-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">{serviceLabel}</p>
              <p className="font-semibold leading-6">{serviceName}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">{statusLabel}</p>
              <StatusBadge tone="neutral">{status}</StatusBadge>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">{updatedLabel}</p>
              <p className="font-semibold leading-6">{updatedValue}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span>{progressLabel}</span>
              <span>{progressText}</span>
            </div>
            <Progress value={progress} label={progressLabel} />
          </div>
          <div className="rounded-item border border-primary/20 bg-secondary p-4">
            <p className="text-sm text-muted-foreground">{nextActionLabel}</p>
            <p className="mt-1 font-semibold leading-6 text-secondary-foreground">{nextAction}</p>
          </div>
        </CardContent>
      </Card>
      {blocking ? <BlockingReasonAlert title={blocking.title} description={blocking.description} /> : null}
    </section>
  );
}
