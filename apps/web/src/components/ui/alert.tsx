import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const alertVariants = {
  info: "border-primary/25 bg-secondary text-secondary-foreground",
  warning: "border-warning/30 bg-warning/10 text-foreground",
  error: "border-error/30 bg-error/10 text-foreground",
  success: "border-success/30 bg-success/10 text-foreground",
} as const;

export function Alert({
  className,
  variant = "info",
  ...props
}: ComponentProps<"div"> & { variant?: keyof typeof alertVariants }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-sm leading-6",
        alertVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
