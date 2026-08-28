"use client";

import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
}

export function TextGenerateEffect({ words, className = "" }: TextGenerateEffectProps) {
  const wordArray = words.trim().split(/\s+/);

  return (
    <span className={cn("inline", className)} aria-label={words}>
      {wordArray.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="hero-word-reveal mr-[0.24em] inline-block last:mr-0"
          aria-hidden="true"
          style={{
            animationDelay: `${index * 70}ms`,
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
