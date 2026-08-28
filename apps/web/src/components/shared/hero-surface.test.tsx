import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeroSurface } from "@/components/shared/hero-surface";

describe("HeroSurface", () => {
  it("keeps hero copy and the fading illustration in one labelled surface", () => {
    const markup = renderToStaticMarkup(
      <HeroSurface
        titleId="hero-title"
        title="Welcome back, Aarav"
        description="Your next step is ready."
        actions={<button type="button">Continue</button>}
      />,
    );

    expect(markup).toContain('aria-labelledby="hero-title"');
    expect(markup).toContain('id="hero-title"');
    expect(markup).toContain("Welcome back, Aarav");
    expect(markup).not.toContain("hero-illustration-fade");
    expect(markup).toContain("drop-shadow-[0_16px_24px_rgba(11,47,85,0.14)]");
    expect(markup).toContain('viewBox="0 0 720 440"');
    expect(markup).toContain("space-y-4");
    expect(markup).toContain("pt-8");
    expect(markup).toContain("gap-7");
  });

  it("uses the open treatment without the floating-card chrome when requested", () => {
    const markup = renderToStaticMarkup(
      <HeroSurface
        variant="open"
        titleId="dashboard-title"
        title="Welcome back, Aarav"
        description="Your work is ready to review."
      />,
    );

    expect(markup).toContain('data-hero-variant="open"');
    expect(markup).toContain("border-b");
    expect(markup).not.toContain("rounded-feature");
  });

  it("offers a shared featured treatment for public and signed-in landing pages", () => {
    const markup = renderToStaticMarkup(
      <HeroSurface
        variant="featured"
        titleId="featured-title"
        title="Welcome back, Aarav"
        description="Your next step is ready to review."
      />,
    );

    expect(markup).toContain('data-hero-variant="featured"');
    expect(markup).toContain("rounded-feature");
    expect(markup).toContain("text-primary-foreground");
  });
});
