import { cookies } from "next/headers";
import { cache } from "react";

import { selectDataSource } from "@/lib/data-source";
import { resolveSessionFromCookie } from "@/server/auth/session-service";

import { readMockSession } from "./api/mock-session";
import type { ShellSession } from "./types";

export const getRequestSession = cache(async () => {
  const cookieHeader = (await cookies()).toString();
  return resolveSessionFromCookie(cookieHeader, { touch: true });
});

async function getRealSession(): Promise<ShellSession> {
  const session = await getRequestSession();
  if (session.kind === "authenticated") return { kind: "authenticated", user: session.user };
  return session;
}

export const getShellSession = selectDataSource({
  real: getRealSession,
  mock: readMockSession,
});
