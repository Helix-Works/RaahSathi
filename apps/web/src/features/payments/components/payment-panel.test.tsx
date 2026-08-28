import type { PaymentContext, PaymentStatus } from "@raahsathi/contracts/payments";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";

import { PaymentPanel } from "./payment-panel";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function context(status?: PaymentStatus): PaymentContext {
  return {
    applicationId: "30000000-0000-4000-8000-000000000001",
    fee: {
      snapshotId: "40000000-0000-4000-8000-000000000001",
      baseFeeMinor: 50_000,
      serviceChargeMinor: 5_000,
      totalAmountMinor: 55_000,
      currency: "INR",
    },
    attempt: status ? {
      id: "50000000-0000-4000-8000-000000000001",
      status,
      attemptNumber: 1,
      providerReference: "SYN-PAY-50000000-0000-4000-8000-000000000001",
      createdAt: "2026-08-24T12:00:00.000Z",
      updatedAt: "2026-08-24T12:00:00.000Z",
      succeededAt: status === "SUCCEEDED" ? "2026-08-24T12:01:00.000Z" : null,
    } : null,
  };
}

function render(status?: PaymentStatus, locale: "en" | "hi" = "en") {
  const dictionary = locale === "hi" ? hiMessages : enMessages;
  return renderToStaticMarkup(
    <PaymentPanel
      initialContext={context(status)}
      locale={locale}
      messages={dictionary.payments}
      onApplicationChanged={vi.fn(async () => undefined)}
    />,
  );
}

describe("payment panel presentation", () => {
  it("renders only the authoritative fee breakdown and payment entry", () => {
    const html = render();

    expect(html).toContain("Licence fee");
    expect(html).toContain("₹500.00");
    expect(html).toContain("₹50.00");
    expect(html).toContain("₹550.00");
    expect(html).toContain("Pay fee");
    expect(html).not.toContain("receipt");
  });

  it.each([
    ["PENDING", "Waiting for provider result", "Refresh status"],
    ["SUCCEEDED", "Payment confirmed", "Payment is complete"],
    ["FAILED", "Payment failed safely", "Start a new payment attempt"],
    ["PROVIDER_UNAVAILABLE", "Provider unavailable", "Start a new payment attempt"],
  ] as const)("renders %s without exposing the raw enum", (status, label, action) => {
    const html = render(status);

    expect(html).toContain(label);
    expect(html).toContain(action);
    expect(html).not.toContain(`>${status}<`);
  });

  it("renders localized Hindi payment status and recovery copy", () => {
    const html = render("PROVIDER_UNAVAILABLE", "hi");

    expect(html).toContain("प्रदाता अनुपलब्ध");
    expect(html).toContain("भुगतान का नया प्रयास शुरू करें");
    expect(html).toContain("भुगतान संदर्भ");
    expect(html).toContain("RS-PAY-50000000-0000-4000-8000-000000000001");
    expect(html).not.toContain("SYN-PAY-50000000-0000-4000-8000-000000000001");
  });
});
