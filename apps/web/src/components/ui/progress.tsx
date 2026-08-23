import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type ProgressProps = Omit<ComponentProps<"div">, "children"> &
  Readonly<{
    value: number;
    label: string;
  }>;

export function Progress({ className, value, label, ...props }: ProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn("h-2.5 overflow-hidden border border-border-strong bg-muted", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
      {...props}
    >
      <div className="h-full bg-primary" style={{ width: `${normalizedValue}%` }} />
    </div>
  );
}
