import type { TransitionStartFunction } from "react";

import type { SafeReturnPath } from "./safe-return-path";

export function navigateAfterLogin(
  replace: (href: SafeReturnPath) => void,
  startTransition: TransitionStartFunction,
  returnTo: SafeReturnPath,
): void {
  startTransition(() => replace(returnTo));
}
