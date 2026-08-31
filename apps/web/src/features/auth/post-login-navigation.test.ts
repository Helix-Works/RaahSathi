import { describe, expect, it, vi } from "vitest";

import { navigateAfterLogin } from "./post-login-navigation";

describe("navigateAfterLogin", () => {
  it("starts exactly one full-shell replacement without requesting a router refresh", () => {
    const replaceDocument = vi.fn();
    const refresh = vi.fn();
    const startTransition = vi.fn((action: () => void) => action());

    navigateAfterLogin(replaceDocument, startTransition, "/dashboard");

    expect(startTransition).toHaveBeenCalledTimes(1);
    expect(replaceDocument).toHaveBeenCalledOnce();
    expect(replaceDocument).toHaveBeenCalledWith("/dashboard");
    expect(refresh).not.toHaveBeenCalled();
  });
});
