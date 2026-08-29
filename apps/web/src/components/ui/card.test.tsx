import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("keeps service cards as solid, scroll-stable surfaces", () => {
    const markup = renderToStaticMarkup(<Card variant="service">Service</Card>);

    expect(markup).toContain("bg-[#e1f2ff]");
    expect(markup).toContain("transition-[border-color,box-shadow]");
    expect(markup).not.toContain("backdrop-blur");
    expect(markup).not.toContain("translate-y");
    const classTokens = (markup.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/);
    expect(classTokens.some((token) => /^(?:[a-z-]+:)*(?:transform|transform-cpu|transform-gpu)$/.test(token))).toBe(false);
  });
});
