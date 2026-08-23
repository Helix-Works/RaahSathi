import {
  ArrowRight,
  Check,
  CircleAlert,
  CircleMinus,
  Inbox,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ message }: Readonly<{ message: string }>) {
  return (
    <section className="space-y-5" aria-busy="true" aria-live="polite">
      <p className="sr-only">{message}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((item) => (
          <Card key={item}>
            <CardContent className="space-y-4 pt-5 sm:pt-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function EmptyState({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-md border border-border bg-muted text-foreground">
          <Inbox className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-extrabold">{title}</h2>
        <p className="max-w-lg leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title,
  description,
  retryLabel,
  retryHref,
  correlationId,
  correlationLabel,
  headingLevel = 2,
}: Readonly<{
  title: string;
  description: string;
  retryLabel?: string;
  retryHref?: string;
  correlationId?: string;
  correlationLabel?: string;
  headingLevel?: 1 | 2;
}>) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <Card className="border-foreground" role="alert">
      <CardContent className="flex flex-col items-start gap-4 py-8">
        <span className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
          <CircleAlert className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <Heading className="text-xl font-extrabold">{title}</Heading>
          <p className="max-w-xl leading-6 text-muted-foreground">{description}</p>
        </div>
        {correlationId && correlationLabel ? (
          <p className="rounded-sm border border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            {correlationLabel}: {correlationId}
          </p>
        ) : null}
        {retryLabel && retryHref ? (
          <a className={buttonVariants({ variant: "outline" })} href={retryHref}>
            {retryLabel}
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}

const badgeTones = {
  neutral: "default",
  success: "outline",
  warning: "warning",
  error: "inverse",
} as const;

const badgeIcons = {
  neutral: CircleMinus,
  success: Check,
  warning: TriangleAlert,
  error: CircleAlert,
} as const;

export function StatusBadge({
  children,
  tone = "neutral",
}: Readonly<{
  children: ReactNode;
  tone?: keyof typeof badgeTones;
}>) {
  const Icon = badgeIcons[tone];

  return (
    <Badge variant={badgeTones[tone]} className="gap-2">
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </Badge>
  );
}

export function NextActionCard({
  title,
  description,
  actionLabel,
  actionHref,
}: Readonly<{
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}>) {
  return (
    <Card className="overflow-hidden border-primary bg-primary text-primary-foreground">
      <CardContent className="grid gap-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:py-6">
        <div className="space-y-2">
          <h2 className="text-xl font-black leading-snug tracking-tight">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-primary-foreground/80 sm:text-base">
            {description}
          </p>
        </div>
        {actionLabel && actionHref ? (
          <Link
            className={buttonVariants({ variant: "secondary", size: "lg" })}
            href={actionHref}
          >
            {actionLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
