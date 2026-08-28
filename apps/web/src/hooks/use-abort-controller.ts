"use client";

import { useCallback, useRef } from "react";

export function useAbortController(): {
  getSignal: (key: string) => AbortSignal;
  abort: (key: string) => void;
  abortAll: () => void;
} {
  const controllers = useRef(new Map<string, AbortController>());

  const getSignal = useCallback((key: string): AbortSignal => {
    controllers.current.get(key)?.abort();
    const controller = new AbortController();
    controllers.current.set(key, controller);
    return controller.signal;
  }, []);

  const abort = useCallback((key: string) => {
    controllers.current.get(key)?.abort();
    controllers.current.delete(key);
  }, []);

  const abortAll = useCallback(() => {
    for (const controller of controllers.current.values()) {
      controller.abort();
    }
    controllers.current.clear();
  }, []);

  return { getSignal, abort, abortAll };
}
