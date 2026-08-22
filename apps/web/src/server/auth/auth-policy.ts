import "server-only";

export const authPolicy = {
  otpLifetimeMs: 5 * 60 * 1_000,
  resendCooldownMs: 60 * 1_000,
  otpAttempts: 5,
  requestWindowMs: 15 * 60 * 1_000,
  requestsPerWindow: 3,
  sessionIdleMs: 30 * 60 * 1_000,
  sessionAbsoluteMs: 8 * 60 * 60 * 1_000,
  sessionTouchIntervalMs: 5 * 60 * 1_000,
  sessionTokenBytes: 32,
  csrfTokenBytes: 32,
  otpSaltBytes: 16,
} as const;

export type AuthPolicy = typeof authPolicy;
