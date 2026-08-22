export type SafeReturnPath = "/" | "/services" | "/dashboard";

const safeReturnPaths = new Set<SafeReturnPath>(["/", "/services", "/dashboard"]);

export function getSafeReturnPath(
  value: string | string[] | undefined,
  fallback: SafeReturnPath = "/dashboard",
): SafeReturnPath {
  if (typeof value !== "string") {
    return fallback;
  }

  return safeReturnPaths.has(value as SafeReturnPath)
    ? (value as SafeReturnPath)
    : fallback;
}
