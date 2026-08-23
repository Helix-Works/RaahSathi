import { z } from "zod";

export type SafeReturnPath =
  | "/"
  | "/services"
  | "/dashboard"
  | "/applications"
  | `/applications/${string}`;

const safeStaticReturnPaths = new Set<SafeReturnPath>([
  "/",
  "/services",
  "/dashboard",
  "/applications",
]);

function isApplicationDetailPath(value: string): value is `/applications/${string}` {
  const match = /^\/applications\/([^/?#]+)$/.exec(value);
  return Boolean(match && z.uuid().safeParse(match[1]).success);
}

export function getSafeReturnPath(
  value: string | string[] | undefined,
  fallback: SafeReturnPath = "/dashboard",
): SafeReturnPath {
  if (typeof value !== "string") {
    return fallback;
  }

  return safeStaticReturnPaths.has(value as SafeReturnPath)
    ? (value as SafeReturnPath)
    : isApplicationDetailPath(value)
      ? value
      : fallback;
}
