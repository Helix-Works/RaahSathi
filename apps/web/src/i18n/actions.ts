"use server";

import { cookies } from "next/headers";

import { isLocale, localeCookieName } from "./config";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function setLocalePreference(formData: FormData): Promise<void> {
  const locale = formData.get("locale");

  if (!isLocale(locale)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, {
    httpOnly: true,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
