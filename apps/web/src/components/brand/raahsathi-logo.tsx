import {
  RaahSathiMark,
  type BrandTone,
} from "@/components/brand/raahsathi-mark";
import { cn } from "@/lib/utils";

export function RaahSathiLogo({
  name,
  descriptor,
  compact = false,
  tone = "default",
  className,
}: Readonly<{
  name: string;
  descriptor?: string;
  compact?: boolean;
  tone?: BrandTone;
  className?: string;
}>) {
  return (
    <span className={cn("brand-lockup inline-flex min-w-0 items-center gap-2", className)}>
      <span
        className="brand-mark-shell grid size-10 shrink-0 place-items-center"
        data-testid="brand-mark"
      >
        <RaahSathiMark tone={tone} />
      </span>
      <span className="min-w-0">
        <span className={cn(
          "brand-wordmark relative block w-fit font-extrabold uppercase tracking-[0.015em] sm:text-lg",
          tone === "inverse" ? "text-primary-foreground" : "text-foreground",
          compact ? "text-sm min-[370px]:text-[1.05rem]" : "text-[1.05rem]",
        )}>
          {name}
        </span>
        {descriptor ? (
          <span className={cn(
            "mt-0.5 hidden text-[0.625rem] font-semibold tracking-[0.1em] xl:block",
            tone === "inverse" ? "text-primary-foreground/60" : "text-muted-foreground",
          )}>
            {descriptor}
          </span>
        ) : null}
      </span>
    </span>
  );
}
