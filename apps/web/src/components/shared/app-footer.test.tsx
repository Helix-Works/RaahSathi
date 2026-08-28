import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppFooter } from "@/components/shared/app-footer";
import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";

describe("AppFooter", () => {
  it.each([enMessages, hiMessages])("keeps the non-affiliation notice visible in every locale", (messages) => {
    const markup = renderToStaticMarkup(<AppFooter messages={messages} />);

    expect(markup).toContain(messages.landing.independenceNotice);
  });
});
