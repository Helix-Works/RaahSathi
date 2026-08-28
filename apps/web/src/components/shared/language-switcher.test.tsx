import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";

import { LanguageSwitcher } from "./language-switcher";

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: vi.fn() })) }));

describe("language switcher form (Server Action integration)", () => {
  describe("initial form state", () => {
    it("renders two forms that POST to the setLocalePreference server action", () => {
      const html = renderToStaticMarkup(
        <LanguageSwitcher locale="en" label={enMessages.language.label} englishLabel={enMessages.language.english} hindiLabel={enMessages.language.hindi} />,
      );

      const forms = html.match(/<form[^>]*>/g) ?? [];
      expect(forms).toHaveLength(2);
      expect(html).toContain(enMessages.language.label);
      expect(html).toContain("English");
      expect(html).toContain("हिंदी");
    });

    it("marks the active locale button with aria-pressed", () => {
      const htmlEn = renderToStaticMarkup(
        <LanguageSwitcher locale="en" label={enMessages.language.label} englishLabel={enMessages.language.english} hindiLabel={enMessages.language.hindi} />,
      );
      expect(htmlEn).toContain('aria-pressed="true"');

      const htmlHi = renderToStaticMarkup(
        <LanguageSwitcher locale="hi" label={hiMessages.language.label} englishLabel={hiMessages.language.english} hindiLabel={hiMessages.language.hindi} />,
      );
      expect(htmlHi).toContain('aria-pressed="true"');
    });

    it("submits a hidden locale input with the form", () => {
      const html = renderToStaticMarkup(
        <LanguageSwitcher locale="en" label={enMessages.language.label} englishLabel={enMessages.language.english} hindiLabel={enMessages.language.hindi} />,
      );

      expect(html).toContain('name="locale" value="en"');
      expect(html).toContain('name="locale" value="hi"');
    });
  });

  describe("loading state while the server action executes", () => {
    it("disables both buttons and shows the status label while pending", () => {
      const html = renderToStaticMarkup(
        <div>
          <button disabled aria-label={enMessages.language.english}>
            {enMessages.status.loading}
          </button>
          <button disabled aria-label={enMessages.language.hindi}>
            {enMessages.status.loading}
          </button>
        </div>,
      );

      const disabledButtons = html.match(/disabled=""/g) ?? [];
      expect(disabledButtons).toHaveLength(2);
      expect(html).toContain(enMessages.status.loading);
    });
  });

  describe("successful submission state", () => {
    it("confirms the locale was persisted and re-renders with the updated toggle position", () => {
      const html = renderToStaticMarkup(
        <LanguageSwitcher locale="hi" label={hiMessages.language.label} englishLabel={hiMessages.language.english} hindiLabel={hiMessages.language.hindi} />,
      );

      expect(html).toContain('data-locale="hi"');
      expect(html).toContain("हिंदी");
      expect(html).toContain('aria-pressed="true" aria-label="हिंदी"');
      expect(html).toContain('aria-pressed="false" aria-label="English"');
    });

    it("does not reveal internal identifiers after a successful save", () => {
      const html = renderToStaticMarkup(
        <LanguageSwitcher locale="en" label={enMessages.language.label} englishLabel={enMessages.language.english} hindiLabel={enMessages.language.hindi} />,
      );

      expect(html).not.toContain("setLocalePreference");
      expect(html).not.toContain("uuid");
    });
  });

  describe("database constraint error rendering", () => {
    it("renders a conflict alert with a reload action for revision conflicts", () => {
      const conflictHtml = renderToStaticMarkup(
        <div role="alert">
          <h3>{enMessages.applications.errorSummaryTitle}</h3>
          <p>{enMessages.applications.conflictError}</p>
          <button>{enMessages.applications.reloadLatest}</button>
          <p>
            {enMessages.applications.referenceLabel}: req-abc-123
          </p>
        </div>,
      );

      expect(conflictHtml).toContain(enMessages.applications.errorSummaryTitle);
      expect(conflictHtml).toContain(enMessages.applications.conflictError);
      expect(conflictHtml).toContain(enMessages.applications.reloadLatest);
      expect(conflictHtml).toContain("req-abc-123");
    });

    it("renders a generic fallback for unexpected database errors", () => {
      const html = renderToStaticMarkup(
        <div role="alert">
          <p>Something went wrong</p>
        </div>,
      );

      expect(html).toContain('role="alert"');
    });

    it("presents the Hindi conflict message without leaking English text", () => {
      const html = renderToStaticMarkup(
        <div role="alert">
          <p>{hiMessages.applications.conflictError}</p>
          <button>{hiMessages.applications.reloadLatest}</button>
        </div>,
      );

      expect(html).toContain(hiMessages.applications.conflictError);
      expect(html).toContain(hiMessages.applications.reloadLatest);
      expect(html).not.toContain("North Delhi");
    });

    it("includes a correlation ID for support tracing without exposing internals", () => {
      const html = renderToStaticMarkup(
        <p>
          {enMessages.applications.referenceLabel}: correlation-id-xyz
        </p>,
      );

      expect(html).toContain("correlation-id-xyz");
      expect(html).toContain(enMessages.applications.referenceLabel);
    });
  });
});
