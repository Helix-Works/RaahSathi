import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-7 w-fit items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-semibold leading-4",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-secondary-foreground",
        outline: "border-primary/30 bg-card text-primary",
        success: "border-success/30 bg-success-surface text-success",
        warning: "border-warning/35 bg-warning-surface text-warning",
        error: "border-destructive/30 bg-destructive-surface text-destructive",
        inverse: "border-primary bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
