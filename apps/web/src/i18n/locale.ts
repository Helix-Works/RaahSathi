import { cookies } from "next/headers";

import { localeCookieName, resolveLocale, type Locale } from "./config";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();

  return resolveLocale(cookieStore.get(localeCookieName)?.value);
}
