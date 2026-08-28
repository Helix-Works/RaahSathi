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
import { IconTile } from "@/components/shared/icon-tile";

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
        <IconTile size="lg" tone="neutral">
          <Inbox className="size-6" aria-hidden="true" />
        </IconTile>
        <h2 className="text-xl font-bold">{title}</h2>
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
    <Card className="border-destructive/30" role="alert">
      <CardContent className="flex flex-col items-start gap-4 py-8">
        <IconTile tone="destructive">
          <CircleAlert className="size-6" aria-hidden="true" />
        </IconTile>
        <div className="space-y-2">
          <Heading className="text-xl font-bold">{title}</Heading>
          <p className="max-w-xl leading-6 text-muted-foreground">{description}</p>
        </div>
        {correlationId && correlationLabel ? (
          <p className="rounded-control border border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
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
  success: "success",
  warning: "warning",
  error: "error",
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
  eyebrow,
  headingId,
  title,
  description,
  actionLabel,
  actionHref,
  variant = "strong",
}: Readonly<{
  eyebrow?: string;
  headingId?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  variant?: "strong" | "subtle";
}>) {
  return (
    <Card
      className={variant === "strong"
        ? "overflow-hidden border-primary bg-primary text-primary-foreground"
        : "border-primary/15 bg-[rgba(232,244,253,0.58)] shadow-subtle"}
    >
      <CardContent className="grid gap-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:py-5">
        <div className="space-y-2">
          {eyebrow ? (
            <p className={variant === "strong" ? "text-sm font-semibold text-primary-foreground/75" : "text-sm font-semibold text-primary"}>{eyebrow}</p>
          ) : null}
          <h2 id={headingId} className="text-lg font-bold leading-snug tracking-tight sm:text-xl">{title}</h2>
          <p className={variant === "strong" ? "max-w-2xl text-sm leading-6 text-primary-foreground/80 sm:text-base" : "max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base"}>
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
