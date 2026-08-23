import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setLocalePreference } from "@/i18n/actions";
import type { Locale } from "@/i18n";

type LanguageSwitcherProps = Readonly<{
  locale: Locale;
  label: string;
  englishLabel: string;
  hindiLabel: string;
}>;

export function LanguageSwitcher({
  locale,
  label,
  englishLabel,
  hindiLabel,
}: LanguageSwitcherProps) {
  return (
    <div
      className="flex min-h-10 items-center rounded-md border border-primary-foreground/35 bg-primary-foreground p-0.5 text-primary"
      role="group"
      aria-label={label}
    >
      <Languages
        className="mx-1 hidden size-4 text-primary/60 min-[390px]:block"
        aria-hidden="true"
      />
      {([
        ["en", englishLabel],
        ["hi", hindiLabel],
      ] as const).map(([value, languageLabel]) => (
        <form action={setLocalePreference} key={value}>
          <input type="hidden" name="locale" value={value} />
          <Button
            className="min-h-9 rounded-sm px-2 text-xs sm:px-2.5"
            variant={locale === value ? "secondary" : "ghost"}
            size="sm"
            type="submit"
            aria-pressed={locale === value}
            aria-label={languageLabel}
          >
            <span className="hidden sm:inline">{languageLabel}</span>
            <span className="sm:hidden" aria-hidden="true">
              {value === "en" ? "EN" : "हि"}
            </span>
          </Button>
        </form>
      ))}
    </div>
  );
}
