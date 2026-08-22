import type { Locale } from "./config";
import { enMessages, type MessageDictionary } from "./messages/en";
import { hiMessages } from "./messages/hi";

const dictionaries = {
  en: enMessages,
  hi: hiMessages,
} satisfies Record<Locale, MessageDictionary>;

export function getDictionary(locale: Locale): MessageDictionary {
  return dictionaries[locale];
}
