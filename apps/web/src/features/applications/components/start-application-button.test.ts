import { describe, expect, it } from "vitest";

import { getServiceLoginPath } from "./start-application-button";

describe("service login intent", () => {
  it.each([
    "LEARNER_LICENCE",
    "PERMANENT_DRIVING_LICENCE",
    "DRIVING_LICENCE_RENEWAL",
    "DRIVING_LICENCE_ADDRESS_CHANGE",
  ] as const)("preserves the selected %s service through login", (serviceKey) => {
    const url = new URL(getServiceLoginPath(serviceKey), "http://localhost");

    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("returnTo")).toBe("/services");
    expect(url.searchParams.get("serviceKey")).toBe(serviceKey);
  });
});
