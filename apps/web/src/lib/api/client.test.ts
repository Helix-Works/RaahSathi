import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./client";

describe("API CSRF transport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("copies the readable CSRF cookie into authenticated mutation headers", async () => {
    vi.stubGlobal("document", { cookie: "raahsathi_csrf=csrf-token" });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("x-csrf-token")).toBe("csrf-token");
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await apiRequest("/auth/logout", { method: "POST" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("does not add CSRF to safe methods", async () => {
    vi.stubGlobal("document", { cookie: "raahsathi_csrf=csrf-token" });
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).has("x-csrf-token")).toBe(false);
      return Response.json({ user: { id: "10000000-0000-4000-8000-000000000001", displayName: "Demo", preferredLocale: "en" } });
    }));
    await apiRequest("/me");
  });

  it("ignores a malformed CSRF cookie instead of throwing", async () => {
    vi.stubGlobal("document", { cookie: "raahsathi_csrf=%E0%A4" });
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).has("x-csrf-token")).toBe(false);
      return new Response(null, { status: 204 });
    }));
    await expect(apiRequest("/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });
});
