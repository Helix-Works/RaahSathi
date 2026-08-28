import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = Readonly<{
  title: string;
  description?: string;
  eyebrow?: string;
  id?: string;
  action?: ReactNode;
  className?: string;
  align?: "start" | "center";
  contentClassName?: string;
  descriptionClassName?: string;
}>;

export function SectionHeader({
  title,
  description,
  eyebrow,
  id,
  action,
  className,
  align = "start",
  contentClassName,
  descriptionClassName,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex w-full flex-col gap-4",
        align === "start" && "sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <div className={cn("min-w-0 max-w-2xl space-y-3", align === "center" && "mx-auto", contentClassName)}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id={id} className="text-2xl font-bold leading-tight tracking-[-0.025em] sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className={cn("text-sm leading-6 text-muted-foreground sm:text-base", descriptionClassName)}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className={cn("shrink-0", align === "center" && "mx-auto")}>{action}</div> : null}
    </header>
  );
}
