import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LanguageSwitcher } from "@/components/shared/language-switcher";

describe("LanguageSwitcher", () => {
  it("renders one collapsed language-menu trigger with the current language", () => {
    const markup = renderToStaticMarkup(
      <LanguageSwitcher locale="en" label="Choose language" englishLabel="English" hindiLabel="हिंदी" />,
    );

    expect(markup).toContain('aria-haspopup="menu"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("English");
    expect(markup).not.toContain('role="group"');
    expect(markup).not.toContain('role="menu"');
  });
});
