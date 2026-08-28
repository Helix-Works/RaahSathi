import type { ServiceKey } from "@raahsathi/contracts";

import type { MessageDictionary } from "@/i18n";

export function getServiceCopy(
  serviceKey: ServiceKey,
  messages: MessageDictionary["services"],
): Readonly<{ name: string; description: string }> {
  switch (serviceKey) {
    case "LEARNER_LICENCE":
      return {
        name: messages.learnerName,
        description: messages.learnerDescription,
      };
    case "PERMANENT_DRIVING_LICENCE":
      return {
        name: messages.permanentName,
        description: messages.permanentDescription,
      };
    case "DRIVING_LICENCE_RENEWAL":
      return {
        name: messages.renewalName,
        description: messages.renewalDescription,
      };
    case "DRIVING_LICENCE_ADDRESS_CHANGE":
      return {
        name: messages.addressChangeName,
        description: messages.addressChangeDescription,
      };
  }
}
