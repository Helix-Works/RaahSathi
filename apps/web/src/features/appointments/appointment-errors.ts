import type { Locale } from "@/i18n";
import { ApiClientError } from "@/lib/api";

export type AppointmentErrorAction = "retry" | "reload" | "signin" | "reconstruct" | "refresh-slots" | "refresh-calendar";

export type AppointmentErrorPresentation = Readonly<{
  message: string;
  action: AppointmentErrorAction;
}>;

export function appointmentErrorPresentation(error: unknown, locale: Locale): AppointmentErrorPresentation {
  const hi = locale === "hi";
  const generic = hi
    ? "अपॉइंटमेंट सेवा अभी उत्तर नहीं दे सकी। आपकी आवेदन प्रगति सुरक्षित है।"
    : "The appointment service could not respond. Your application progress is safe.";
  if (!(error instanceof ApiClientError)) return { message: generic, action: "retry" };

  switch (error.code) {
    case "AUTHENTICATION_REQUIRED":
    case "AUTH_SESSION_EXPIRED":
      return { message: hi ? "आपका सत्र समाप्त हो गया है। सुरक्षित रूप से जारी रखने के लिए दोबारा साइन इन करें।" : "Your session has expired. Sign in again to continue safely.", action: "signin" };
    case "CSRF_INVALID":
      return { message: hi ? "सुरक्षा टोकन पुराना हो गया है। पेज फिर लोड करें।" : "The security token is stale. Reload the page and try again.", action: "reload" };
    case "CAPACITY_FULL":
      return { message: hi ? "आपके पुष्टि करने से पहले अंतिम स्थान बुक हो गया। नवीनतम स्लॉट दिखाए गए हैं।" : "The final place was booked before you confirmed. The latest slots are now shown.", action: "refresh-slots" };
    case "SLOT_ELAPSED":
    case "SLOTS_NOT_RELEASED":
      return { message: hi ? "यह स्लॉट अब बुक नहीं किया जा सकता। नवीनतम उपलब्धता चुनें।" : "This slot can no longer be booked. Choose from the latest availability.", action: "refresh-slots" };
    case "CENTER_UNAVAILABLE":
    case "BOOKING_SERVICE_UNAVAILABLE":
      return { message: hi ? "इस आरटीओ में बुकिंग अभी उपलब्ध नहीं है। नवीनतम कैलेंडर फिर देखें।" : "Booking is currently unavailable at this RTO. Check the latest calendar again.", action: "refresh-calendar" };
    case "APPOINTMENT_ALREADY_BOOKED":
      return { message: hi ? "एक अपॉइंटमेंट पहले ही पक्का है। उसका सुरक्षित विवरण लोड किया जा रहा है।" : "An appointment is already confirmed. Its saved details are being loaded.", action: "reconstruct" };
    case "APPOINTMENT_RATE_LIMITED": {
      const wait = error.retryAfterSeconds;
      const suffix = wait === undefined ? "" : hi ? ` ${wait} सेकंड बाद फिर कोशिश करें।` : ` Try again in ${wait} seconds.`;
      return { message: `${hi ? "बहुत अधिक अपॉइंटमेंट प्रयास हुए।" : "Too many appointment attempts were made."}${suffix}`, action: "retry" };
    }
    case "VALIDATION_FAILED":
    case "ACCESS_DENIED":
    case "RESOURCE_NOT_FOUND":
    case "APPOINTMENT_NOT_ELIGIBLE":
      return { message: hi ? "यह बुकिंग अनुरोध अब मान्य नहीं है। आवेदन की नवीनतम स्थिति देखें।" : "This booking request is no longer valid. Review the latest application state.", action: "retry" };
    case "APPOINTMENT_CAPACITY_INVARIANT":
    case "INTERNAL_SERVER_ERROR":
    default:
      return { message: generic, action: "retry" };
  }
}
