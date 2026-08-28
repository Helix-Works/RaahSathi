"use client";

import { GlobalError } from "@/components/shared/global-error";

export default function ServicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GlobalError error={error} reset={reset} />;
}
