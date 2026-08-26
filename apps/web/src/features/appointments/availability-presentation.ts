import type { AvailabilityReasonCode } from "@raahsathi/contracts/appointments";

import type { MessageDictionary } from "@/i18n";

export function availabilityReasonMessage(
  reason: AvailabilityReasonCode,
  messages: MessageDictionary["appointments"],
): string {
  return messages.reasons[reason];
}
