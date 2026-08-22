export const supportedLocales = ["en", "hi"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "raahsathi_locale";

export function isLocale(value: unknown): value is Locale {
  return supportedLocales.some((locale) => locale === value);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}
