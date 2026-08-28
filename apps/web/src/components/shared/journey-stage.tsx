import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { IconTile } from "@/components/shared/icon-tile";
import { StatusBadge } from "@/components/shared/state-presentations";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StageTone = "default" | "success" | "warning" | "destructive";
type StatusTone = "neutral" | "success" | "warning" | "error";

export function JourneyStageHeader({
  title,
  description,
  icon: Icon,
  tone = "default",
  status,
}: Readonly<{
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: StageTone;
  status?: Readonly<{ label: string; tone: StatusTone }>;
}>) {
  return (
    <CardHeader className="border-b border-border bg-surface-muted">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <IconTile tone={tone}>
            <Icon aria-hidden="true" />
          </IconTile>
          <div className="min-w-0 space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        {status ? <StatusBadge tone={status.tone}>{status.label}</StatusBadge> : null}
      </div>
    </CardHeader>
  );
}

export function DefinitionGrid({ children, className }: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-panel border border-border bg-border sm:grid-cols-2", className)}>
      {children}
    </dl>
  );
}

export function DefinitionItem({ label, children }: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <div className="min-w-0 bg-card p-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold leading-6">{children}</dd>
    </div>
  );
}

export function StageActionPanel({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="border-t border-border pt-5">{children}</div>;
}

export function SelectableStageCard({
  selected,
  className,
  ...props
}: ComponentProps<"button"> & Readonly<{ selected: boolean }>) {
  return (
    <button
      {...props}
      data-selected={selected}
      aria-pressed={selected}
      className={cn(
        "flex h-full min-w-0 flex-col rounded-item border border-border bg-card p-4 text-left shadow-subtle transition-[border-color,box-shadow,background-color] hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 data-[selected=true]:border-primary data-[selected=true]:bg-accent data-[selected=true]:shadow-elevated",
        className,
      )}
    />
  );
}
