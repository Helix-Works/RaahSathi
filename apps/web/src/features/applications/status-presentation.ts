import type { ApplicationDetail } from "@raahsathi/contracts/applications";

import type { MessageDictionary } from "@/i18n";

type BlockingReasonCode = NonNullable<ApplicationDetail["blockingReasonCode"]>;

export function applicationBlockingReasonMessage(
  reason: BlockingReasonCode,
  messages: MessageDictionary["applications"],
): string {
  const blockingReasons: Readonly<Record<BlockingReasonCode, string>> = {
    IDENTITY_VERIFICATION_REQUIRED: messages.blockingIdentity,
    PAYMENT_REQUIRED: messages.blockingPayment,
    NO_SUITABLE_SLOT: messages.blockingNoSuitableSlot,
    WAITLIST_OFFER_PENDING: messages.blockingWaitlistOfferPending,
  };
  return blockingReasons[reason];
}
