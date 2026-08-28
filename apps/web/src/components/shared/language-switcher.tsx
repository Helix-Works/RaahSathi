"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { setLocalePreference } from "@/i18n/actions";
import type { Locale } from "@/i18n";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = Readonly<{
  locale: Locale;
  label: string;
  englishLabel: string;
  hindiLabel: string;
}>;

export function LanguageSwitcher({ locale, label, englishLabel, hindiLabel }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const languages = [["en", englishLabel], ["hi", hindiLabel]] as const;
  const currentLabel = locale === "en" ? englishLabel : hindiLabel;

  useEffect(() => {
    if (!open) return;

    optionRefs.current[locale === "en" ? 0 : 1]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [locale, open]);

  const moveFocus = (index: number, direction: 1 | -1) => {
    const nextIndex = (index + direction + languages.length) % languages.length;
    optionRefs.current[nextIndex]?.focus();
  };

  const selectLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    const formData = new FormData();
    formData.set("locale", nextLocale);
    startTransition(async () => {
      await setLocalePreference(formData);
      setOpen(false);
      window.location.reload();
    });
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border bg-card px-3 text-sm font-semibold text-foreground transition-[border-color,background-color,box-shadow] hover:border-primary/35 hover:bg-secondary focus-visible:outline-focus"
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Globe2 className="size-4 text-primary" aria-hidden="true" />
        <span className="hidden sm:inline">{currentLabel}</span>
        <span className="sm:hidden" aria-hidden="true">{locale === "en" ? "EN" : "हिं"}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-44 overflow-hidden rounded-panel border border-border bg-card p-1.5 shadow-elevated"
          role="menu"
          aria-label={label}
          aria-busy={isPending}
        >
          {languages.map(([value, languageLabel], index) => (
            <button
              key={value}
              ref={(node) => { optionRefs.current[index] = node; }}
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-4 rounded-control px-3 text-left text-sm font-semibold hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-focus",
                locale === value ? "text-primary" : "text-foreground",
              )}
              type="button"
              role="menuitemradio"
              aria-checked={locale === value}
              disabled={isPending}
              onClick={() => selectLocale(value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  moveFocus(index, event.key === "ArrowDown" ? 1 : -1);
                }
              }}
            >
              {languageLabel}
              {locale === value ? <Check className="size-4" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
