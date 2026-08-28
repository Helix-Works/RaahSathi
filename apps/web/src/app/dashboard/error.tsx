"use client";

import { GlobalError } from "@/components/shared/global-error";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GlobalError error={error} reset={reset} />;
}
