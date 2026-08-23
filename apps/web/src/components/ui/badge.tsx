import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-7 w-fit items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-extrabold leading-4",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-foreground",
        outline: "border-foreground bg-card text-foreground",
        warning: "border-foreground border-dashed bg-secondary text-foreground",
        inverse: "border-foreground bg-primary text-primary-foreground",
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
