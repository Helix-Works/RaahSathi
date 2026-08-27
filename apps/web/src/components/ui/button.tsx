import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex h-auto min-h-11 items-center justify-center gap-2 whitespace-normal rounded-control border border-transparent px-4 py-2 text-center text-sm font-semibold leading-5 shadow-none transition-[background-color,border-color,color,box-shadow] focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground! shadow-subtle hover:bg-primary-hover",
        secondary:
          "border-border bg-secondary text-secondary-foreground! hover:border-border-strong hover:bg-accent",
        outline:
          "border-input bg-card text-card-foreground! hover:border-primary/55 hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        destructive:
          "bg-destructive text-primary-foreground! shadow-subtle hover:bg-destructive/90",
      },
      size: {
        default: "min-h-11 px-4",
        sm: "min-h-11 px-3 py-1.5 text-xs",
        lg: "min-h-11 px-4 py-2.5 text-sm",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
