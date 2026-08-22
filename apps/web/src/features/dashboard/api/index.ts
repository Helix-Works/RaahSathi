import { selectDataSource } from "@/lib/data-source";

import { getMockDashboardSummary } from "./mock";
import { getRealDashboardSummary } from "./real";

export const getDashboardSummary = selectDataSource({
  real: getRealDashboardSummary,
  mock: getMockDashboardSummary,
});
