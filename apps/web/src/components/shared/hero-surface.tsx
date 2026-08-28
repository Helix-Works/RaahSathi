import type { ReactNode } from "react";

import { JourneyIllustration } from "@/components/brand/journey-illustration";
import { cn } from "@/lib/utils";

type HeroSurfaceProps = Readonly<{
  title: string;
  description: string;
  titleId: string;
  actions?: ReactNode;
  className?: string;
  variant?: "card" | "open" | "featured";
}>;

export function HeroSurface({
  title,
  description,
  titleId,
  actions,
  className,
  variant = "card",
}: HeroSurfaceProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden",
        variant === "card" && "rounded-feature border border-primary/15 bg-card shadow-elevated",
        variant === "open" && "border-b border-primary/10 bg-[linear-gradient(105deg,#ffffff_0%,#ffffff_43%,#f1f9ff_100%)]",
        variant === "featured" && "rounded-feature border border-primary/20 bg-[linear-gradient(110deg,#075fae_0%,#137bc4_52%,#65b8e7_100%)] text-primary-foreground shadow-elevated",
        className,
      )}
      aria-labelledby={titleId}
      data-hero-variant={variant}
    >
      <div
        className={cn(
          "absolute inset-0",
          variant === "card" && "bg-[radial-gradient(circle_at_72%_30%,rgba(85,182,235,0.18),transparent_42%)]",
          variant === "open" && "bg-[radial-gradient(circle_at_72%_38%,rgba(85,182,235,0.15),transparent_37%)]",
          variant === "featured" && "bg-[radial-gradient(circle_at_72%_32%,rgba(255,255,255,0.22),transparent_42%)]",
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative grid items-center gap-7",
          variant === "card" && "min-h-[24rem] px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-3 lg:px-10 lg:py-8",
          variant === "open" && "mx-auto min-h-[20rem] w-full max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[23rem] lg:grid-cols-[0.82fr_1.18fr] lg:gap-0 lg:px-8 lg:py-6",
          variant === "featured" && "min-h-[23rem] px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-3 lg:px-10 lg:py-8",
        )}
      >
        <div className="relative z-10 max-w-xl">
          <div className="space-y-4">
            <h1
              id={titleId}
              className={cn(
                "font-bold leading-[1.06] tracking-[-0.04em] text-balance",
                variant === "card" && "text-[clamp(2rem,3.4vw,2.85rem)]",
                variant === "open" && "text-[clamp(2rem,3vw,2.65rem)]",
                variant === "featured" && "text-[clamp(2rem,3.4vw,2.85rem)] text-primary-foreground",
              )}
            >
              {title}
            </h1>
            <p className={cn(
              "max-w-lg text-base leading-7 text-muted-foreground",
              variant === "card" && "sm:text-lg sm:leading-8",
              variant === "open" && "sm:text-[1.05rem] sm:leading-7",
              variant === "featured" && "text-primary-foreground/85 sm:text-lg sm:leading-8",
            )}>
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-col gap-7 pt-8 min-[390px]:flex-row">{actions}</div> : null}
        </div>
        <div
          className={cn(
            "relative self-end drop-shadow-[0_16px_24px_rgba(11,47,85,0.14)]",
            variant === "card" && "-mx-4 -mb-8 sm:-mx-6 sm:-mb-10 lg:-mr-10 lg:-mb-8 lg:ml-0",
            variant === "open" && "-mx-4 -mb-8 sm:-mx-6 sm:-mb-10 lg:-mr-8 lg:-mb-10 lg:ml-0",
            variant === "featured" && "-mx-4 -mb-8 sm:-mx-6 sm:-mb-10 lg:-mr-10 lg:-mb-8 lg:ml-0",
          )}
        >
          <JourneyIllustration
            className={cn(
              "ml-auto",
              variant === "card" && "max-w-[45rem]",
              variant === "open" && "max-w-[48rem]",
              variant === "featured" && "max-w-[45rem]",
            )}
          />
        </div>
      </div>
    </section>
  );
}
