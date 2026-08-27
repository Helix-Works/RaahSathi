export type OfferTiming = Readonly<{
  remainingMilliseconds: number;
  acceptanceDisabled: boolean;
}>;

export function offerTiming(expiresAt: string, nowMilliseconds: number): OfferTiming {
  const remainingMilliseconds = new Date(expiresAt).getTime() - nowMilliseconds;
  return { remainingMilliseconds, acceptanceDisabled: remainingMilliseconds <= 0 };
}
