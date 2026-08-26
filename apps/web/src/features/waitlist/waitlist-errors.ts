import type { Locale, MessageDictionary } from "@/i18n";
import { ApiClientError } from "@/lib/api";

export type WaitlistErrorAction = "retry" | "reload" | "signin" | "recover";

export type WaitlistErrorPresentation = Readonly<{ message: string; action: WaitlistErrorAction }>;

export function waitlistErrorPresentation(
  error: unknown,
  locale: Locale,
  messages: MessageDictionary["waitlist"],
): WaitlistErrorPresentation {
  const generic = locale === "hi"
    ? "वेटलिस्ट स्थिति अभी लोड नहीं हो सकी। आपकी सहेजी गई आवेदन प्रगति सुरक्षित है।"
    : "The waitlist status could not be loaded right now. Your saved application progress is safe.";
  if (!(error instanceof ApiClientError)) return { message: generic, action: "retry" };
  switch (error.code) {
    case "AUTHENTICATION_REQUIRED": case "AUTH_SESSION_EXPIRED":
      return { message: locale === "hi" ? "आपका सत्र समाप्त हो गया है। सुरक्षित रूप से जारी रखने के लिए दोबारा साइन इन करें।" : "Your session has expired. Sign in again to continue safely.", action: "signin" };
    case "CSRF_INVALID": return { message: locale === "hi" ? "सुरक्षा टोकन पुराना हो गया है। पेज फिर लोड करें।" : "The security token is stale. Reload the page and try again.", action: "reload" };
    case "WAITLIST_NOT_ELIGIBLE": return { message: messages.errors.notEligible, action: "recover" };
    case "WAITLIST_ALREADY_ACTIVE": return { message: messages.errors.alreadyActive, action: "recover" };
    case "WAITLIST_OFFER_ACTIVE": return { message: messages.errors.offerActive, action: "recover" };
    case "WAITLIST_RATE_LIMITED": {
      const suffix = error.retryAfterSeconds === undefined ? "" : locale === "hi" ? ` ${error.retryAfterSeconds} सेकंड बाद फिर कोशिश करें।` : ` Try again in ${error.retryAfterSeconds} seconds.`;
      return { message: `${messages.errors.rateLimited}${suffix}`, action: "retry" };
    }
    case "OFFER_EXPIRED": return { message: messages.errors.offerExpired, action: "recover" };
    case "OFFER_ALREADY_CONSUMED": return { message: messages.errors.offerConsumed, action: "recover" };
    case "OFFER_STATE_CONFLICT": return { message: messages.errors.offerConflict, action: "recover" };
    default: return { message: generic, action: "retry" };
  }
}
