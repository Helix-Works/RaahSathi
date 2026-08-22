import "server-only";

import type { CurrentUser } from "@raahsathi/contracts/auth";

export type AuthenticatedContext = Readonly<{
  sessionId: string;
  applicantId: string;
}>;

export type ResolvedSession =
  | Readonly<{ kind: "anonymous" }>
  | Readonly<{ kind: "expired" }>
  | Readonly<{
      kind: "authenticated";
      context: AuthenticatedContext;
      user: CurrentUser;
      csrfSecretHash: string;
    }>;

export type IssuedSession = Readonly<{
  sessionToken: string;
  csrfToken: string;
  absoluteExpiresAt: Date;
}>;
