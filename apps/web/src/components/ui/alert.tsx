import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const alertVariants = {
  info: "border-border-strong bg-secondary text-secondary-foreground",
  warning: "border-border-strong border-dashed bg-surface-muted text-foreground",
  error: "border-foreground border-double bg-card text-foreground",
  success: "border-foreground bg-card text-foreground",
} as const;

export function Alert({
  className,
  variant = "info",
  ...props
}: ComponentProps<"div"> & { variant?: keyof typeof alertVariants }) {
  return (
    <div
      className={cn(
        "rounded-md border p-4 text-sm leading-6",
        alertVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("font-extrabold leading-6", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />
  );
}
