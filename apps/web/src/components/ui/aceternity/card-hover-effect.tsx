"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CardHoverEffectProps {
  children: ReactNode;
  className?: string;
}

export function CardHoverEffect({ children, className = "" }: CardHoverEffectProps) {
  return (
    <div className={cn("group relative", className)}>
      <div
        className="absolute -inset-0.5 rounded-feature bg-gradient-to-r from-primary/20 to-brand-accent/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100 group-hover:blur-sm"
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
