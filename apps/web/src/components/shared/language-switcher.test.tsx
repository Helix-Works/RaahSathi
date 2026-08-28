import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";

import { LanguageSwitcher } from "./language-switcher";

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: vi.fn() })) }));

function renderEn() {
  return renderToStaticMarkup(
    <LanguageSwitcher
      locale="en"
      label={enMessages.language.label}
      englishLabel={enMessages.language.english}
      hindiLabel={enMessages.language.hindi}
    />,
  );
}

describe("language switcher form (Server Action integration)", () => {
  it("renders two forms that POST to the setLocalePreference server action", () => {
    const html = renderEn();

    const forms = html.match(/<form[^>]*>/g) ?? [];
    expect(forms).toHaveLength(2);
    expect(html).toContain(enMessages.language.label);
    expect(html).toContain("English");
    expect(html).toContain("हिंदी");
  });

  it("marks the active locale button with aria-pressed", () => {
    const htmlEn = renderEn();
    expect(htmlEn).toContain('aria-pressed="true"');

    const htmlHi = renderToStaticMarkup(
      <LanguageSwitcher
        locale="hi"
        label={hiMessages.language.label}
        englishLabel={hiMessages.language.english}
        hindiLabel={hiMessages.language.hindi}
      />,
    );
    expect(htmlHi).toContain('aria-pressed="true"');
  });

  it("submits a hidden locale input with the form", () => {
    const html = renderEn();

    expect(html).toContain('name="locale" value="en"');
    expect(html).toContain('name="locale" value="hi"');
  });

  it("reflects a persisted hi preference with the localized toggle position", () => {
    const html = renderToStaticMarkup(
      <LanguageSwitcher
        locale="hi"
        label={hiMessages.language.label}
        englishLabel={hiMessages.language.english}
        hindiLabel={hiMessages.language.hindi}
      />,
    );

    expect(html).toContain('data-locale="hi"');
    expect(html).toContain("हिंदी");
    expect(html).toContain('aria-pressed="true" aria-label="हिंदी"');
    expect(html).toContain('aria-pressed="false" aria-label="English"');
  });

  it("does not reveal internal server-action identifiers", () => {
    const html = renderEn();

    expect(html).not.toContain("setLocalePreference");
    expect(html).not.toContain("uuid");
  });
});
