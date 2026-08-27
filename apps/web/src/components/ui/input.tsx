import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-control border border-input bg-card px-3 py-2 text-base leading-6 text-foreground shadow-none outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-destructive/15",
        className,
      )}
      {...props}
    />
  );
}
