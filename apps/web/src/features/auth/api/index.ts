import { selectDataSource } from "@/lib/data-source";

import { mockAuthApi } from "./mock";
import { realAuthApi } from "./real";

export const authApi = selectDataSource({
  real: realAuthApi,
  mock: mockAuthApi,
});
