import type { ApplicationDetail } from "@raahsathi/contracts/applications";
import type { Appointment } from "@raahsathi/contracts/appointments";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";

import { AppointmentPanel } from "./appointment-panel";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const application = {
  id: "20000000-0000-4000-8000-000000000001",
  serviceKey: "LEARNER_LICENCE",
  statusCode: "APPOINTMENT_BOOKED",
} as unknown as ApplicationDetail;

const appointment = {
  id: "10000000-0000-4000-8000-000000000001",
  applicationId: application.id,
  slotId: "30000000-0000-4000-8000-000000000001",
  serviceKey: "LEARNER_LICENCE",
  status: "CONFIRMED",
  rto: { id: "40000000-0000-4000-8000-000000000001", code: "SYNTHETIC_ROHINI", nameEn: "Synthetic Rohini RTO", nameHi: "कृत्रिम रोहिणी आरटीओ", district: "North Delhi", status: "AVAILABLE" },
  date: "2026-08-28", startTime: "10:00", endTime: "10:30", bookedAt: "2026-08-26T10:00:00.000Z", cancelledAt: null,
} as const satisfies Appointment;

function render(locale: "en" | "hi") {
  const dictionary = locale === "hi" ? hiMessages : enMessages;
  return renderToStaticMarkup(<AppointmentPanel application={application} initialAppointment={appointment} locale={locale} messages={dictionary.appointments} onApplicationChanged={vi.fn(async () => undefined)} />);
}

describe("appointment panel reconstruction", () => {
  it("renders authoritative confirmed details without exposing identifiers", () => {
    const html = render("en");
    expect(html).toContain("Appointment confirmed");
    expect(html).toContain("Synthetic Rohini RTO");
    expect(html).toContain("10:00–10:30");
    expect(html).not.toContain(appointment.id);
    expect(html).not.toContain("join the waitlist");
  });

  it("renders the reconstructed confirmation in Hindi", () => {
    const html = render("hi");
    expect(html).toContain("अपॉइंटमेंट पक्का है");
    expect(html).toContain("कृत्रिम रोहिणी आरटीओ");
    expect(html).toContain("उत्तरी दिल्ली");
    expect(html).not.toContain("North Delhi");
  });
});
