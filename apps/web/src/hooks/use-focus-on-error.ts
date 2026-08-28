"use client";

import { useEffect, useRef } from "react";

export function useFocusOnError(
  error: unknown,
  shouldFocus: boolean = true,
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && shouldFocus && ref.current) {
      ref.current.focus();
    }
  }, [error, shouldFocus]);

  return ref;
}
