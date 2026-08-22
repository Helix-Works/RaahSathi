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
      className="flex min-h-11 items-center rounded-xl border border-border bg-card p-1"
      role="group"
      aria-label={label}
    >
      <Languages
        className="mx-1 hidden size-4 text-muted-foreground min-[390px]:block"
        aria-hidden="true"
      />
      {([
        ["en", englishLabel],
        ["hi", hindiLabel],
      ] as const).map(([value, languageLabel]) => (
        <form action={setLocalePreference} key={value}>
          <input type="hidden" name="locale" value={value} />
          <Button
            className="min-h-9 rounded-lg px-2.5 text-xs sm:px-3"
            variant={locale === value ? "secondary" : "ghost"}
            size="sm"
            type="submit"
            aria-pressed={locale === value}
          >
            {languageLabel}
          </Button>
        </form>
      ))}
    </div>
  );
}
