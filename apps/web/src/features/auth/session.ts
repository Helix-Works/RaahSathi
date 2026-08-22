import { cookies } from "next/headers";

import { getRealCurrentUser } from "@/features/auth/api/real";
import { ApiClientError } from "@/lib/api";
import { selectDataSource } from "@/lib/data-source";

import { readMockSession } from "./api/mock-session";
import type { ShellSession } from "./types";

async function getRealSession(): Promise<ShellSession> {
  const cookieHeader = (await cookies()).toString();

  if (!cookieHeader) {
    return { kind: "anonymous" };
  }

  try {
    const session = await getRealCurrentUser(cookieHeader);
    return { kind: "authenticated", user: session.user };
  } catch (error: unknown) {
    if (error instanceof ApiClientError && error.status === 401) {
      return { kind: "anonymous" };
    }

    throw error;
  }
}

export const getShellSession = selectDataSource({
  real: getRealSession,
  mock: readMockSession,
});
