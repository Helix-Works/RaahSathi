import { describe, expect, it } from "vitest";

import { enMessages } from "@/i18n/messages/en";
import { hiMessages } from "@/i18n/messages/hi";

import { getServiceCopy } from "./presentation";

describe("four-service catalogue presentation", () => {
  it("maps every service to explicit English and Hindi citizen copy", () => {
    expect(getServiceCopy("LEARNER_LICENCE", enMessages.services).name).toBe("New Learner Licence");
    expect(getServiceCopy("PERMANENT_DRIVING_LICENCE", enMessages.services).name).toBe("Permanent Driving Licence");
    expect(getServiceCopy("DRIVING_LICENCE_RENEWAL", enMessages.services).name).toBe("Driving Licence Renewal");
    expect(getServiceCopy("DRIVING_LICENCE_ADDRESS_CHANGE", enMessages.services).name).toBe("Change of Address");
    expect(getServiceCopy("DRIVING_LICENCE_RENEWAL", hiMessages.services).name).toBe("ड्राइविंग लाइसेंस नवीनीकरण");
    expect(getServiceCopy("DRIVING_LICENCE_ADDRESS_CHANGE", hiMessages.services).name).toBe("पता बदलें");
  });
});
