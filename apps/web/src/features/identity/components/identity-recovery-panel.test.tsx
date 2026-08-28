import type { IdentityContext, IdentityOutcome } from "@raahsathi/contracts/identity";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";

import { IdentityRecoveryPanel } from "./identity-recovery-panel";

function context(outcome?: IdentityOutcome): IdentityContext {
  return {
    attempt: outcome ? {
      id: "50000000-0000-4000-8000-000000000001",
      outcome,
      attemptNumber: 1,
      retryable: outcome !== "VERIFIED" && outcome !== "USER_MISMATCH",
      createdAt: "2026-08-24T12:00:00.000Z",
    } : null,
    documents: [
      {
        id: "60000000-0000-4000-8000-000000000001",
        kind: "SYNTHETIC_IDENTITY_PROOF",
        syntheticReference: "SYN-ID-00000001",
        issuedAt: "2026-08-24T12:00:00.000Z",
      },
      {
        id: "60000000-0000-4000-8000-000000000002",
        kind: "SYNTHETIC_ADDRESS_PROOF",
        syntheticReference: "SYN-ADDR-00000002",
        issuedAt: "2026-08-24T12:00:00.000Z",
      },
    ],
  };
}

function render(outcome?: IdentityOutcome, locale: "en" | "hi" = "en") {
  return renderToStaticMarkup(
    <IdentityRecoveryPanel
      applicationId="30000000-0000-4000-8000-000000000001"
      initialContext={context(outcome)}
      messages={locale === "hi" ? hiMessages : enMessages}
      onApplicationChanged={vi.fn(async () => undefined)}
    />,
  );
}

describe("identity recovery panel presentation", () => {
  it("shows the synthetic metadata and a safe start action before an attempt", () => {
    const html = render();

    expect(html).toContain("Document metadata");
    expect(html).toContain("Identity proof metadata");
    expect(html).toContain("Address proof metadata");
    expect(html).toContain("SYN-ID-00000001");
    expect(html).toContain("Start verification");
  });

  it.each([
    ["VERIFIED", "Verified", "Identity is verified", false],
    ["OTP_INVALID", "OTP rejected", "Retry without re-entering", true],
    ["USER_MISMATCH", "Review required", "Automatic retry is not allowed", false],
    ["TIMEOUT", "Timed out", "attempt can be retried", true],
    ["PROVIDER_UNAVAILABLE", "Provider unavailable", "attempt can be retried", true],
    ["RETRY_REQUIRED", "Retry required", "requires a fresh attempt", true],
  ] as const)("renders the %s provider outcome without exposing raw enum text", (outcome, label, description, retryable) => {
    const html = render(outcome);

    expect(html).toContain(label);
    expect(html).toContain(description);
    expect(html).not.toContain(`>${outcome}<`);
    expect(html.includes("Retry safely")).toBe(retryable);
  });

  it("keeps Hindi recovery and metadata labels readable", () => {
    const html = render("PROVIDER_UNAVAILABLE", "hi");

    expect(html).toContain("दस्तावेज़ मेटाडेटा");
    expect(html).toContain("प्रदाता अनुपलब्ध");
    expect(html).toContain("सुरक्षित रूप से फिर प्रयास करें");
  });
});
