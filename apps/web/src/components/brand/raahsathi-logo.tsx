import { RaahSathiMark } from "@/components/brand/raahsathi-mark";
import { cn } from "@/lib/utils";

export function RaahSathiLogo({
  name,
  descriptor,
  compact = false,
  className,
}: Readonly<{
  name: string;
  descriptor?: string;
  compact?: boolean;
  className?: string;
}>) {
  return (
    <span className={cn("brand-lockup inline-flex min-w-0 items-center gap-2.5", className)}>
      <span
        className="brand-mark-shell grid size-10 shrink-0 place-items-center rounded-[0.9rem] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        data-testid="brand-mark"
      >
        <RaahSathiMark />
      </span>
      <span className="min-w-0">
        <span className={cn(
          "brand-wordmark relative block w-fit font-black tracking-[-0.035em] text-primary-foreground sm:text-lg",
          compact ? "text-sm min-[370px]:text-[1.05rem]" : "text-[1.05rem]",
        )}>
          {name}
        </span>
        {descriptor ? (
          <span className="mt-0.5 hidden text-[0.625rem] font-bold uppercase tracking-[0.16em] text-primary-foreground/50 xl:block">
            {descriptor}
          </span>
        ) : null}
      </span>
    </span>
  );
}
