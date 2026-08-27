import type { ApplicationDetail } from "@raahsathi/contracts/applications";
import { availabilityReasonCodeSchema } from "@raahsathi/contracts/appointments";
import { describe, expect, it } from "vitest";

import { applicationBlockingReasonMessage } from "@/features/applications/status-presentation";
import { availabilityReasonMessage } from "@/features/appointments/availability-presentation";
import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";
import { apiErrors } from "@/server/http/api-error";

describe("Phase 6 bilingual presentation mappings", () => {
  it("maps every application blocking reason in English and Hindi", () => {
    const reasons = [
      "IDENTITY_VERIFICATION_REQUIRED",
      "PAYMENT_REQUIRED",
      "NO_SUITABLE_SLOT",
      "WAITLIST_OFFER_PENDING",
    ] as const satisfies readonly NonNullable<ApplicationDetail["blockingReasonCode"]>[];
    for (const reason of reasons) {
      expect(applicationBlockingReasonMessage(reason, enMessages.applications)).toBeTruthy();
      expect(applicationBlockingReasonMessage(reason, hiMessages.applications)).toBeTruthy();
    }
  });

  it("maps every availability code without exposing protocol text", () => {
    for (const reason of availabilityReasonCodeSchema.options) {
      expect(availabilityReasonMessage(reason, enMessages.appointments)).not.toBe(reason);
      expect(availabilityReasonMessage(reason, hiMessages.appointments)).not.toBe(reason);
    }
  });

  it("provides English and Hindi copy for every waitlist API error", () => {
    const errors = [
      apiErrors.waitlistNotEligible(),
      apiErrors.waitlistAlreadyActive(),
      apiErrors.waitlistOfferActive(),
      apiErrors.waitlistRateLimited(),
      apiErrors.offerExpired(),
      apiErrors.offerAlreadyConsumed(),
      apiErrors.offerStateConflict(),
    ];
    for (const error of errors) {
      const key = error.messageKey.replace("waitlist.errors.", "") as keyof typeof enMessages.waitlist.errors;
      expect(enMessages.waitlist.errors[key]).toBeTruthy();
      expect(hiMessages.waitlist.errors[key]).toBeTruthy();
    }
  });

  it("keeps residual waitlist labels in both typed dictionaries", () => {
    expect(enMessages.waitlist.chooseRto).toBe("Choose an RTO");
    expect(enMessages.waitlist.time).toBe("Time");
    expect(hiMessages.waitlist.chooseRto).not.toBe(enMessages.waitlist.chooseRto);
    expect(hiMessages.waitlist.time).not.toBe(enMessages.waitlist.time);
    expect(hiMessages.appointments.chooseRto).not.toBe(enMessages.appointments.chooseRto);
    expect(hiMessages.appointments.time).not.toBe(enMessages.appointments.time);
  });
});
