import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const iconTileVariants = cva(
  "inline-grid shrink-0 place-items-center rounded-item border",
  {
    variants: {
      tone: {
        default: "border-primary/20 bg-secondary text-primary",
        neutral: "border-border bg-muted text-secondary-foreground",
        success: "border-success/25 bg-success-surface text-success",
        warning: "border-warning/30 bg-warning-surface text-warning",
        destructive:
          "border-destructive/25 bg-destructive-surface text-destructive",
        inverse:
          "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground",
      },
      size: {
        sm: "size-9 [&_svg]:size-4",
        default: "size-11 [&_svg]:size-5",
        lg: "size-12 [&_svg]:size-6",
      },
    },
    defaultVariants: {
      tone: "default",
      size: "default",
    },
  },
);

export function IconTile({
  className,
  tone,
  size,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof iconTileVariants>) {
  return (
    <span className={cn(iconTileVariants({ tone, size }), className)} {...props} />
  );
}
