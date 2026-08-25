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
      className="language-toggle relative grid min-h-11 w-[6.8rem] shrink-0 grid-cols-2 items-stretch rounded-full border border-primary-foreground/20 bg-primary-foreground/8 p-1 shadow-inner sm:w-[10.25rem]"
      role="group"
      aria-label={label}
      data-locale={locale}
    >
      <span
        className={cn(
          "language-toggle-indicator pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-brand-accent shadow-[0_0_18px_var(--brand-glow)]",
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
              "min-h-9 min-w-0 rounded-full px-2 text-xs font-black transition-colors duration-200 focus-visible:outline-brand-accent sm:px-3",
              locale === value
                ? "text-brand-accent-foreground"
                : "text-primary-foreground/65 hover:text-primary-foreground",
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
