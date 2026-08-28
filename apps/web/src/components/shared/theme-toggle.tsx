"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/shared/theme-provider";

type ThemeToggleProps = Readonly<{
  label?: string;
  lightLabel?: string;
  darkLabel?: string;
}>;

export function ThemeToggle({
  label = "Theme selection",
  lightLabel = "Light mode",
  darkLabel = "Dark mode",
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: lightLabel },
    { value: "dark" as const, icon: Moon, label: darkLabel },
  ];

  return (
    <div
      className="flex items-center gap-0.5 rounded-control border border-border bg-surface p-0.5"
      role="radiogroup"
      aria-label={label}
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
