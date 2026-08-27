import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JourneyIllustration } from "@/components/brand/journey-illustration";

describe("JourneyIllustration", () => {
  it("stays responsive, decorative, and tied to semantic palette classes", () => {
    const markup = renderToStaticMarkup(<JourneyIllustration className="max-w-xl" />);

    expect(markup).toContain('viewBox="0 0 720 440"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('focusable="false"');
    expect(markup).toContain("h-auto w-full max-w-xl");
    expect(markup).toContain("stroke-surface-strong");
    expect(markup).toContain("fill-primary");
    expect(markup).not.toContain("<title");
  });
});
