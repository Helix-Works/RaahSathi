import type { WaitlistEntry } from "@raahsathi/contracts/waitlist";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";

import { OfferCountdown, TemporaryOfferView } from "./waitlist-stage-views";

const entry = {
  id: "10000000-0000-4000-8000-000000000001",
  applicationId: "20000000-0000-4000-8000-000000000001",
  serviceKey: "LEARNER_LICENCE",
  status: "OFFERED",
  vehicleClass: "LMV",
  acceptableDateFrom: "2026-08-28",
  acceptableDateTo: "2026-08-30",
  timeBuckets: ["MORNING"],
  joinedAt: "2026-08-27T10:00:00.000Z",
  rto: { id: "30000000-0000-4000-8000-000000000001", code: "SYNTHETIC_ROHINI", nameEn: "Synthetic Rohini RTO", nameHi: "कृत्रिम रोहिणी आरटीओ", district: "North Delhi", status: "AVAILABLE" },
  offer: {
    id: "40000000-0000-4000-8000-000000000001",
    status: "ACTIVE",
    offeredAt: "2026-08-27T12:00:00.000Z",
    expiresAt: "2026-08-27T12:30:00.000Z",
    slot: { id: "50000000-0000-4000-8000-000000000001", date: "2026-08-28", startTime: "10:00", endTime: "10:30", vehicleClass: "LMV" },
  },
} as const satisfies WaitlistEntry;

describe("waitlist offer presentation", () => {
  it("provides a visible countdown and absolute expiry for assistive technology", () => {
    const html = renderToStaticMarkup(<OfferCountdown expired={false} remaining="4:09" expiresAt="27 Aug 2026, 6:00 pm" copy={enMessages.waitlist} />);

    expect(html).toContain("Time remaining: 4:09");
    expect(html).toContain("Offer expires: 27 Aug 2026, 6:00 pm");
  });

  it("keeps accept, decline, and leave distinct on an active offer", () => {
    const html = renderToStaticMarkup(<TemporaryOfferView entry={entry} rtoName={entry.rto.nameEn} date="28 Aug 2026" timeLabel={enMessages.waitlist.time} expiresAt="27 Aug 2026, 6:00 pm" remaining="4:09" expired={false} busy={false} copy={enMessages.waitlist} onAccept={vi.fn()} onDecline={vi.fn()} onLeave={vi.fn()} />);

    expect(html).toContain("Accept offer");
    expect(html).toContain("Decline offer");
    expect(html).toContain("Leave waitlist");
    expect(html).toContain("Synthetic Rohini RTO");
  });

  it("announces an expired offer in Hindi", () => {
    const html = renderToStaticMarkup(<OfferCountdown expired remaining="0:00" expiresAt="27 अग॰ 2026, 6:00 pm" copy={hiMessages.waitlist} />);

    expect(html).toContain("ऑफ़र का समय बीत गया है");
  });
});
