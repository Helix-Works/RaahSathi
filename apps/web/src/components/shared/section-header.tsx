import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = Readonly<{
  title: string;
  description?: string;
  eyebrow?: string;
  id?: string;
  action?: ReactNode;
  className?: string;
}>;

export function SectionHeader({
  title,
  description,
  eyebrow,
  id,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl space-y-2">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id={id} className="text-2xl font-bold leading-tight tracking-[-0.025em] sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
