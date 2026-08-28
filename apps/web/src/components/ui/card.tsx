import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-panel border text-card-foreground",
  {
    variants: {
      variant: {
        default: "border-border bg-card shadow-subtle",
        muted: "border-border bg-surface-muted",
        emphasized: "border-primary/25 bg-accent shadow-subtle",
        actionable:
          "border-border bg-card shadow-subtle transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-elevated",
        urgent: "border-warning/35 bg-warning-surface",
        service:
          "border-primary/15 bg-[rgba(225,242,255,0.72)] shadow-subtle backdrop-blur-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-elevated",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Card({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-2.5 p-5 sm:p-6", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-xl font-bold leading-snug tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />
  );
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />
  );
}
