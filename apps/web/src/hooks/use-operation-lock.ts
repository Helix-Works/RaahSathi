"use client";

import { useCallback, useRef } from "react";

export function useOperationLock(): {
  acquire: (key: string) => boolean;
  release: (key: string) => void;
} {
  const locks = useRef(new Set<string>());

  const acquire = useCallback((key: string): boolean => {
    if (locks.current.has(key)) return false;
    locks.current.add(key);
    return true;
  }, []);

  const release = useCallback((key: string) => {
    locks.current.delete(key);
  }, []);

  return { acquire, release };
}
