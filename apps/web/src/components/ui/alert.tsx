import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const alertVariants = {
  info: "border-primary/25 bg-secondary text-secondary-foreground",
  warning: "border-warning/35 bg-warning-surface text-warning",
  error: "border-destructive/35 bg-destructive-surface text-destructive",
  success: "border-success/30 bg-success-surface text-success",
} as const;

export function Alert({
  className,
  variant = "info",
  ...props
}: ComponentProps<"div"> & { variant?: keyof typeof alertVariants }) {
  return (
    <div
      className={cn(
        "rounded-item border p-4 text-sm leading-6",
        alertVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("font-bold leading-6", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("text-sm leading-6 text-inherit opacity-85", className)} {...props} />
  );
}
