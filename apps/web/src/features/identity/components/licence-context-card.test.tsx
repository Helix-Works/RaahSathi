import type { LicenceRecordSummary } from "@raahsathi/contracts/identity";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getDictionary } from "@/i18n";

import { LicenceContextCard } from "./licence-context-card";

const permanentLicence = {
  id: "10000000-0000-4000-8000-000000000001",
  kind: "PERMANENT",
  syntheticReference: "SYN-DL-PERMANENT-0001",
  vehicleClass: "LMV",
  issuedAt: "2024-01-15T00:00:00.000Z",
  validUntil: "2029-01-14T23:59:59.000Z",
  address: { district: "NORTH_WEST", postalCode: "110085" },
  renewedAt: null,
} as const satisfies LicenceRecordSummary;

describe("licence context card", () => {
  it.each([
    ["en", "Permanent driving licence"],
    ["hi", "स्थायी ड्राइविंग लाइसेंस"],
  ] as const)("labels a permanent licence correctly in %s", (locale, label) => {
    const messages = getDictionary(locale);
    const html = renderToStaticMarkup(
      <LicenceContextCard licences={[permanentLicence]} locale={locale} messages={messages.identity.licenceContext} />,
    );

    expect(html).toContain(label);
    expect(html).not.toContain(messages.identity.licenceContext.learner);
  });
});
