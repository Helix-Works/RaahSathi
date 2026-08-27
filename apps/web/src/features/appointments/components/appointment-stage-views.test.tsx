import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";

import { AvailabilityLegend } from "./appointment-stage-views";

describe("appointment availability legend", () => {
  it("keeps every unavailable reason explicit in English", () => {
    const html = renderToStaticMarkup(<AvailabilityLegend reasons={enMessages.appointments.reasons} label="Availability reasons" />);

    expect(html).toContain("This appointment slot is full.");
    expect(html).toContain("Appointment slots have not been released yet.");
    expect(html).toContain("This appointment time has already passed.");
    expect(html).toContain("This center is currently unavailable.");
    expect(html).toContain("Appointment booking is temporarily unavailable.");
  });

  it("uses the translated Hindi reason labels", () => {
    const html = renderToStaticMarkup(<AvailabilityLegend reasons={hiMessages.appointments.reasons} label="उपलब्धता कारण" />);

    expect(html).toContain("यह अपॉइंटमेंट स्लॉट भर चुका है।");
    expect(html).toContain("यह केंद्र अभी उपलब्ध नहीं है।");
  });
});
