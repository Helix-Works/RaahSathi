import { cookies } from "next/headers";

import type { DashboardSummary } from "@/features/dashboard/types";
import { listApplications } from "@/server/applications/application-service";
import { resolveSessionFromCookie } from "@/server/auth/session-service";

export async function getRealDashboardSummary(): Promise<DashboardSummary> {
  const session = await resolveSessionFromCookie((await cookies()).toString());
  if (session.kind !== "authenticated") return {};
  const application = (await listApplications(session.context))[0];
  return application ? { application } : {};
}
