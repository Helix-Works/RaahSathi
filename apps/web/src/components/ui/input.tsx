import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-xl border border-border bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-error",
        className,
      )}
      {...props}
    />
  );
}
