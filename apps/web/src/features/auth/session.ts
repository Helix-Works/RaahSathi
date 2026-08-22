import { selectDataSource } from "@/lib/data-source";

import { readMockSession } from "./api/mock-session";
import type { ShellSession } from "./types";

async function getPendingRealSession(): Promise<ShellSession> {
  // Authenticated Server Component cookie forwarding is not agreed yet.
  // Fail closed as anonymous until backend session/domain topology is defined.
  return { kind: "anonymous" };
}

export const getShellSession = selectDataSource({
  real: getPendingRealSession,
  mock: readMockSession,
});
