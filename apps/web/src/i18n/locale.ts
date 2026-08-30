import { cookies } from "next/headers";
import { cache } from "react";

import { localeCookieName, resolveLocale, type Locale } from "./config";

export const getRequestLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies();

  return resolveLocale(cookieStore.get(localeCookieName)?.value);
});
