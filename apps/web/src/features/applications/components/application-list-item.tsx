import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

import { IconTile } from "@/components/shared/icon-tile";
import { StatusBadge } from "@/components/shared/state-presentations";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ApplicationListItemProps = Readonly<{
  serviceName: string;
  status: string;
  nextAction: string;
  nextActionLabel?: string;
  updatedLabel: string;
  updatedValue: string;
  referenceLabel?: string;
  referenceValue?: string;
  progressLabel: string;
  progress: number;
  progressText: string;
  resumeLabel: string;
  href: string;
  compact?: boolean;
  className?: string;
}>;

export function ApplicationListItem({
  serviceName,
  status,
  nextAction,
  nextActionLabel,
  updatedLabel,
  updatedValue,
  referenceLabel,
  referenceValue,
  progressLabel,
  progress,
  progressText,
  resumeLabel,
  href,
  compact = false,
  className,
}: ApplicationListItemProps) {
  const heading = (
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="text-xl font-bold leading-snug tracking-[-0.025em] sm:text-2xl">{serviceName}</h2>
      <StatusBadge tone="neutral">{status}</StatusBadge>
    </div>
  );
  const details = (
    <>
      <div className="space-y-1">
        {nextActionLabel ? <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{nextActionLabel}</p> : null}
        <p className="font-semibold leading-6 text-secondary-foreground">{nextAction}</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm leading-6 text-muted-foreground">
        <p>{updatedLabel}: {updatedValue}</p>
        {referenceLabel && referenceValue ? <p>{referenceLabel}: {referenceValue}</p> : null}
      </div>
    </>
  );

  return (
    <Card variant="actionable" className={className}>
      <CardContent className={cn(
        "grid gap-5 pt-5 sm:pt-6",
        compact ? "h-full sm:grid-cols-[auto_minmax(0,1fr)] sm:grid-rows-[auto_1fr_auto_auto] sm:items-start" : "lg:grid-cols-[auto_minmax(0,1fr)_14rem_auto] lg:items-center",
      )}>
        <IconTile size="lg"><FileText aria-hidden="true" /></IconTile>
        {compact ? (
          <>
            <div className="min-w-0 sm:col-start-2 sm:row-start-1">
              {heading}
            </div>
            <div className="min-w-0 space-y-2.5 sm:col-start-2 sm:row-start-2 sm:self-center">
              {details}
            </div>
          </>
        ) : (
          <div className="min-w-0 space-y-2.5">
            {heading}
            {details}
          </div>
        )}
        <div className={cn("space-y-2.5", compact && "sm:col-start-2 sm:row-start-3")}>
          <div className="flex items-center justify-between gap-3 text-sm font-semibold">
            <span>{progressLabel}</span><span>{progressText}</span>
          </div>
          <Progress value={progress} label={progressLabel} />
        </div>
        <Link className={cn(buttonVariants({ variant: "outline" }), compact && "sm:col-start-2 sm:row-start-4 sm:self-end sm:justify-self-start")} href={href}>
          {resumeLabel}<ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
