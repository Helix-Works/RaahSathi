import { cookies } from "next/headers";

import { selectDataSource } from "@/lib/data-source";
import { resolveSessionFromCookie } from "@/server/auth/session-service";

import { readMockSession } from "./api/mock-session";
import type { ShellSession } from "./types";

async function getRealSession(): Promise<ShellSession> {
  const cookieHeader = (await cookies()).toString();
  const session = await resolveSessionFromCookie(cookieHeader, { touch: true });
  if (session.kind === "authenticated") return { kind: "authenticated", user: session.user };
  return session;
}

export const getShellSession = selectDataSource({
  real: getRealSession,
  mock: readMockSession,
});
