import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

import { IconTile } from "@/components/shared/icon-tile";
import { StatusBadge } from "@/components/shared/state-presentations";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ApplicationListItemProps = Readonly<{
  serviceName: string;
  status: string;
  nextAction: string;
  updatedLabel: string;
  updatedValue: string;
  resumeLabel: string;
  href: string;
}>;

export function ApplicationListItem({
  serviceName,
  status,
  nextAction,
  updatedLabel,
  updatedValue,
  resumeLabel,
  href,
}: ApplicationListItemProps) {
  return (
    <Card variant="actionable">
      <CardContent className="grid gap-5 pt-5 sm:pt-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <IconTile size="lg"><FileText aria-hidden="true" /></IconTile>
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold leading-snug tracking-[-0.025em] sm:text-2xl">{serviceName}</h2>
            <StatusBadge tone="neutral">{status}</StatusBadge>
          </div>
          <p className="font-semibold leading-6 text-secondary-foreground">{nextAction}</p>
          <p className="text-sm leading-6 text-muted-foreground">{updatedLabel}: {updatedValue}</p>
        </div>
        <Link className={buttonVariants({ variant: "outline" })} href={href}>
          {resumeLabel}<ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
