"use server";

import type { MockSessionScenario } from "@/features/auth/types";

import {
  deleteMockSession,
  isMockSessionScenario,
  writeMockSession,
} from "./mock-session";

export async function establishMockSession(value: unknown): Promise<void> {
  if (!isMockSessionScenario(value)) {
    throw new Error("Invalid development session scenario.");
  }

  await writeMockSession(value);
}

export async function revokeMockSession(): Promise<void> {
  await deleteMockSession();
}

export async function expireMockSession(): Promise<void> {
  const scenario: MockSessionScenario = "expired";
  await writeMockSession(scenario);
}
