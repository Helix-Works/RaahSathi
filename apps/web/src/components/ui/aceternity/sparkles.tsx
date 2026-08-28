"use client";

import type { ReactNode } from "react";

interface SparklesProps {
  children: ReactNode;
  className?: string;
  count?: number;
}

export function Sparkles({ children, className = "", count = 5 }: SparklesProps) {
  const sparkles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 4 + (i % 3) * 2,
    top: `${10 + (i * 17) % 80}%`,
    left: `${5 + (i * 23) % 90}%`,
    delay: `${i * 0.3}s`,
  }));

  return (
    <div className={`relative ${className}`}>
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="absolute animate-pulse rounded-full bg-primary/60"
          style={{
            width: sparkle.size,
            height: sparkle.size,
            top: sparkle.top,
            left: sparkle.left,
            animationDelay: sparkle.delay,
            animationDuration: "2s",
          }}
          aria-hidden="true"
        />
      ))}
      {children}
    </div>
  );
}
