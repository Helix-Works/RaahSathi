import "server-only";

import { keyedHash } from "./crypto";

const mobilePattern = /^[6-9][0-9]{9}$/;

export function normalizeSyntheticMobile(mobileNumber: string): string {
  if (!mobilePattern.test(mobileNumber)) throw new TypeError("Invalid synthetic mobile format.");
  return `+91${mobileNumber}`;
}

export function mobileLookupHash(mobileNumber: string, pepper: string): string {
  return keyedHash(normalizeSyntheticMobile(mobileNumber), pepper);
}

export function maskMobile(mobileNumber: string): string {
  return `••••••${mobileNumber.slice(-4)}`;
}
