import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveSessionFromCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ toString: (): string => "raahsathi_session=test-token" })),
}));

vi.mock("@/server/auth/session-service", () => ({
  resolveSessionFromCookie: mocks.resolveSessionFromCookie,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <Result,>(read: () => Promise<Result>) => {
      let result: Promise<Result> | undefined;
      return () => {
        result ??= read();
        return result;
      };
    },
  };
});

describe("request session memoization", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.resolveSessionFromCookie.mockReset();
  });

  it("shares one database-backed resolution between full and shell consumers", async () => {
    const resolved = {
      kind: "authenticated",
      context: { sessionId: "session-id", applicantId: "applicant-id" },
      user: { id: "applicant-id", displayName: "Aditi Sharma", preferredLocale: "en" },
      csrfSecretHash: "csrf-hash",
    } as const;
    mocks.resolveSessionFromCookie.mockResolvedValue(resolved);
    const { getRequestSession, getShellSession } = await import("./session");

    const [requestSession, firstShell, secondShell] = await Promise.all([
      getRequestSession(),
      getShellSession(),
      getShellSession(),
    ]);

    expect(requestSession).toBe(resolved);
    expect(firstShell).toEqual({ kind: "authenticated", user: resolved.user });
    expect(secondShell).toEqual(firstShell);
    expect(mocks.resolveSessionFromCookie).toHaveBeenCalledOnce();
    expect(mocks.resolveSessionFromCookie).toHaveBeenCalledWith("raahsathi_session=test-token", { touch: true });
  });

  it("preserves the expired-session result", async () => {
    mocks.resolveSessionFromCookie.mockResolvedValue({ kind: "expired" });
    const { getRequestSession, getShellSession } = await import("./session");

    await expect(getRequestSession()).resolves.toEqual({ kind: "expired" });
    await expect(getShellSession()).resolves.toEqual({ kind: "expired" });
    expect(mocks.resolveSessionFromCookie).toHaveBeenCalledOnce();
  });
});
