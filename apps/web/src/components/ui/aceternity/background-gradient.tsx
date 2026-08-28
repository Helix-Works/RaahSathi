"use client";

import type { ReactNode } from "react";

interface BackgroundGradientProps {
  children: ReactNode;
  className?: string;
}

export function BackgroundGradient({ children, className = "" }: BackgroundGradientProps) {
  return (
    <div className={`group relative ${className}`}>
      <div
        className="absolute -inset-0.5 rounded-feature bg-gradient-to-r from-primary/30 via-brand-accent/30 to-primary/30 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
