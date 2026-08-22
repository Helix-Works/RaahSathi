import { ArrowRight, CircleAlert, Inbox } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-extrabold">{title}</h2>
        <p className="max-w-lg leading-7 text-muted-foreground">{description}</p>
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
    <Card className="border-error/30" role="alert">
      <CardContent className="flex flex-col items-start gap-4 py-8">
        <span className="grid size-11 place-items-center rounded-full bg-error/10 text-error">
          <CircleAlert className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <Heading className="text-xl font-extrabold">{title}</Heading>
          <p className="max-w-xl leading-7 text-muted-foreground">{description}</p>
        </div>
        {correlationId && correlationLabel ? (
          <p className="rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
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
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
} as const;

export function StatusBadge({
  children,
  tone = "neutral",
}: Readonly<{
  children: ReactNode;
  tone?: keyof typeof badgeTones;
}>) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold",
        badgeTones[tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
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
    <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground">
      <CardContent className="grid gap-6 py-7 sm:grid-cols-[1fr_auto] sm:items-center sm:py-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
          <p className="max-w-2xl leading-7 text-primary-foreground/80">
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
