"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/shared/theme-provider";

const themeOptions = [
  { value: "light" as const, icon: Sun, label: "Light mode" },
  { value: "dark" as const, icon: Moon, label: "Dark mode" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center gap-0.5 rounded-control border border-border bg-surface p-0.5"
      role="radiogroup"
      aria-label="Theme selection"
    >
      {themeOptions.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          onClick={() => setTheme(value)}
          className={`flex size-8 items-center justify-center rounded-control text-sm transition-colors ${
            theme === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
