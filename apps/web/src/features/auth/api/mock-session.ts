import { cookies } from "next/headers";

import type { MockSessionScenario, ShellSession } from "@/features/auth/types";
import { dataSource } from "@/lib/data-source";

const mockSessionCookieName = "raahsathi_mock_session";
const mockSessionMaxAge = 60 * 60;
function assertMockMode(): void {
  if (dataSource !== "mock") {
    throw new Error("Development mock authentication is disabled.");
  }
}

export function isMockSessionScenario(value: unknown): value is MockSessionScenario {
  return (
    value === "active" ||
    value === "empty" ||
    value === "appointment" ||
    value === "expired"
  );
}

function isAuthenticatedMockScenario(
  value: unknown,
): value is Exclude<MockSessionScenario, "expired"> {
  return value === "active" || value === "empty" || value === "appointment";
}

export async function writeMockSession(scenario: MockSessionScenario): Promise<void> {
  assertMockMode();
  const cookieStore = await cookies();
  cookieStore.set(mockSessionCookieName, scenario, {
    httpOnly: true,
    maxAge: mockSessionMaxAge,
    path: "/",
    sameSite: "lax",
    secure: false,
  });
}

export async function deleteMockSession(): Promise<void> {
  assertMockMode();
  const cookieStore = await cookies();
  cookieStore.delete(mockSessionCookieName);
}

export async function readMockSession(): Promise<ShellSession> {
  assertMockMode();
  const cookieStore = await cookies();
  const value = cookieStore.get(mockSessionCookieName)?.value;

  if (value === "expired") {
    return { kind: "expired" };
  }

  if (!isAuthenticatedMockScenario(value)) {
    return { kind: "anonymous" };
  }

  return {
    kind: "authenticated",
    user: {
      id: "synthetic-citizen",
      displayName: "RaahSathi Demo",
      preferredLocale: "en",
    },
  };
}

export async function readMockDashboardScenario(): Promise<
  Exclude<MockSessionScenario, "expired"> | undefined
> {
  assertMockMode();
  const cookieStore = await cookies();
  const value = cookieStore.get(mockSessionCookieName)?.value;

  return isAuthenticatedMockScenario(value) ? value : undefined;
}
