import { describe, expect, it } from "vitest";

import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectStrings);
}

describe("citizen-facing copy", () => {
  it("keeps implementation terminology out of English presentation strings", () => {
    expect(collectStrings(enMessages).join("\n")).not.toMatch(/\b(?:prototype|synthetic|simulated)\b/i);
  });

  it("keeps implementation terminology out of Hindi presentation strings", () => {
    expect(collectStrings(hiMessages).join("\n")).not.toMatch(/कृत्रिम|नकली|प्रोटोटाइप|सिमुलेट/);
  });
});
