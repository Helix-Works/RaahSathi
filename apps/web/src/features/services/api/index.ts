import { selectDataSource } from "@/lib/data-source";

import { getMockServices } from "./mock";
import { getRealServices } from "./real";

export const getServices = selectDataSource({
  real: getRealServices,
  mock: getMockServices,
});
