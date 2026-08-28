import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

describe("theme toggle hydration", () => {
  it("renders a hydration-safe light default without an unexplained system option", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(html).not.toContain('aria-label="System theme"');
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-checked="true" aria-label="Light mode"/);
  });
});
