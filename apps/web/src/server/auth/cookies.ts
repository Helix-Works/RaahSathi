import "server-only";

export const sessionCookieName = "raahsathi_session";
export const csrfCookieName = "raahsathi_csrf";

export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export function sessionCookieOptions(expires: Date, production: boolean) {
  return { httpOnly: true, secure: production, sameSite: "lax" as const, path: "/", expires, maxAge: expires.getTime() === 0 ? 0 : 8 * 60 * 60 };
}

export function csrfCookieOptions(expires: Date, production: boolean) {
  return { httpOnly: false, secure: production, sameSite: "lax" as const, path: "/", expires, maxAge: expires.getTime() === 0 ? 0 : 8 * 60 * 60 };
}
