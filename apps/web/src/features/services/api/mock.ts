import type { ServiceSummary } from "@raahsathi/contracts";

import { serviceFixtures } from "@/mocks/fixtures/services";

export async function getMockServices(): Promise<readonly ServiceSummary[]> {
  return serviceFixtures;
}
