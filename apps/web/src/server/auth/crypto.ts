import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function randomBase64Url(bytes: number): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function keyedHash(value: string, pepper: string): string {
  return createHmac("sha256", pepper).update(value, "utf8").digest("hex");
}

export function hashOtp(otp: string, salt: string, pepper: string): string {
  return keyedHash(`${salt}:${otp}`, pepper);
}

export function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return leftBytes.byteLength === rightBytes.byteLength && timingSafeEqual(leftBytes, rightBytes);
}
