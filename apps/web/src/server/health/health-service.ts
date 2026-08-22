import { apiErrors } from "../http/api-error";

export type ReadinessCheck = () => Promise<void>;

export async function getReadiness(check: ReadinessCheck): Promise<{ status: "ready"; database: "up" }> {
  try {
    await check();
    return { status: "ready", database: "up" };
  } catch {
    throw apiErrors.unavailable();
  }
}
