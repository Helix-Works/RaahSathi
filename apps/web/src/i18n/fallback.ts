"use client";

import type { Locale } from "./config";
import { resolveLocale } from "./config";
import { enMessages, type MessageDictionary } from "./messages/en";
import { hiMessages } from "./messages/hi";

const fallbackDictionaries: Record<Locale, MessageDictionary["fallback"]> = {
  en: enMessages.fallback,
  hi: hiMessages.fallback,
};

export function getClientLocaleCookie(): Locale {
  if (typeof document === "undefined") return "en";
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("raahsathi_locale="))
    ?.split("=")[1];
  return resolveLocale(value);
}

export function getFallbackMessages(): MessageDictionary["fallback"] {
  return fallbackDictionaries[getClientLocaleCookie()];
}
