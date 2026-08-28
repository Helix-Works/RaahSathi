import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type BrandTone = "default" | "inverse";

export function RaahSathiMark({
  className,
  tone = "default",
  ...props
}: ComponentProps<"svg"> & Readonly<{ tone?: BrandTone }>) {
  return (
    <svg
      {...props}
      viewBox="0 0 44 44"
      fill="none"
      className={cn("size-9", className)}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9.2 5.5h18.4c7.2 0 11.6 4 11.6 10.1 0 4.4-2.5 7.8-6.8 9.3L42 38.5H31.8L21.7 24.1h5.5c2.8 0 4.5-1.5 4.5-3.8 0-2.2-1.8-3.5-4.8-3.5H5.2L9.2 5.5Z"
        className={cn(
          tone === "inverse" ? "fill-primary-foreground" : "fill-[#1976d2]",
        )}
      />
      <path
        d="M12.4 13.2h13.3c5.2 0 8.3 2.6 8.3 6.7 0 3-1.7 5.2-4.8 6.2l7.3 10.4h-8.7l-7.4-10.8h-3.1L13.5 38H4.2l7.1-21.2H7.6l4.8-3.6Z"
        className={cn(
          tone === "inverse" ? "fill-brand-accent" : "fill-primary",
        )}
      />
      <path
        d="M16.8 19.1h9.1c1.7 0 2.7.8 2.7 2.1 0 1.4-1.1 2.3-2.9 2.3h-10.4l1.5-4.4Z"
        className={cn(tone === "inverse" ? "fill-surface-strong" : "fill-card")}
      />
    </svg>
  );
}
