import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function RaahSathiMark({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("size-10", className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="14"
        className="fill-primary-foreground/6 stroke-primary-foreground/25"
      />
      <path
        d="M13 36V12h10.5c6 0 9.5 3 9.5 7.2 0 4.1-3.5 6.8-9.5 6.8H13l10.5-.1c6.5 0 10.5 2.3 10.5 6.1 0 3.7-3.7 5.7-9.4 5.7H19"
        className="brand-road-shadow stroke-primary-foreground/85"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 36V12h10.5c6 0 9.5 3 9.5 7.2 0 4.1-3.5 6.8-9.5 6.8H13l10.5-.1c6.5 0 10.5 2.3 10.5 6.1 0 3.7-3.7 5.7-9.4 5.7H19"
        className="brand-road-line stroke-brand-accent"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2.5 3.4"
      />
      <circle cx="13" cy="36" r="2.8" className="brand-endpoint fill-brand-accent" />
      <circle cx="19" cy="37.7" r="2.8" className="brand-endpoint fill-brand-accent" />
    </svg>
  );
}
