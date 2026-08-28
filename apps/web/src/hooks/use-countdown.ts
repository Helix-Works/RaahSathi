"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdown(
  totalSeconds: number,
  onComplete?: () => void,
): {
  secondsRemaining: number;
  isRunning: boolean;
  start: () => void;
  reset: () => void;
} {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const onCompleteRef = useRef(onComplete);
  const isRunningRef = useRef(false);
  const completionHandledRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stop = useCallback(() => {
    if (intervalRef.current !== undefined) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
      isRunningRef.current = false;
      setIsRunning(false);
    }
  }, []);

  const start = useCallback(() => {
    stop();
    completionHandledRef.current = false;
    setSecondsRemaining((current) => {
      if (current <= 0) return totalSeconds;
      return current;
    });
    isRunningRef.current = true;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((current) => (current <= 1 ? 0 : current - 1));
    }, 1_000);
  }, [totalSeconds, stop]);

  useEffect(() => {
    if (isRunning && secondsRemaining <= 0 && !completionHandledRef.current) {
      completionHandledRef.current = true;
      stop();
      onCompleteRef.current?.();
    }
  }, [isRunning, secondsRemaining, stop]);

  const reset = useCallback(() => {
    stop();
    completionHandledRef.current = false;
    setSecondsRemaining(totalSeconds);
  }, [totalSeconds, stop]);

  useEffect(() => () => stop(), [stop]);

  return {
    secondsRemaining,
    isRunning,
    start,
    reset,
  };
}
