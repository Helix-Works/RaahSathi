import { setLocalePreference } from "@/i18n/actions";
import type { Locale } from "@/i18n";
import { cn } from "@/lib/utils";

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
      className="language-toggle relative grid min-h-11 w-[6.5rem] shrink-0 grid-cols-2 items-stretch rounded-control border border-border bg-secondary sm:w-[10.25rem]"
      role="group"
      aria-label={label}
      data-locale={locale}
    >
      <span
        className={cn(
          "language-toggle-indicator pointer-events-none absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-[0.375rem] bg-primary shadow-subtle",
          locale === "hi" && "translate-x-full",
        )}
        aria-hidden="true"
        data-testid="language-toggle-indicator"
      />
      {([
        ["en", englishLabel],
        ["hi", hindiLabel],
      ] as const).map(([value, languageLabel]) => (
        <form action={setLocalePreference} key={value} className="relative z-10 grid min-w-0">
          <input type="hidden" name="locale" value={value} />
          <button
            className={cn(
              "min-h-11 min-w-0 rounded-control px-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-focus sm:px-3",
              locale === value
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            type="submit"
            aria-pressed={locale === value}
            aria-label={languageLabel}
          >
            <span className="hidden sm:inline">{languageLabel}</span>
            <span className="sm:hidden" aria-hidden="true">{value === "en" ? "EN" : "हिं"}</span>
          </button>
        </form>
      ))}
    </div>
  );
}
