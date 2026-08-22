import {
  createInvalidResponseError,
  createNetworkError,
  normalizeApiError,
} from "./errors";

const apiBaseUrl = "/api/v1";
const csrfCookieName = "raahsathi_csrf";
const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

function readBrowserCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const item = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : undefined;
}

export type ApiRequestOptions = Omit<
  RequestInit,
  "body" | "credentials" | "headers"
> & {
  headers?: HeadersInit;
  json?: unknown;
};

function resolveApiUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new TypeError("API paths must be root-relative paths.");
  }

  return `${apiBaseUrl}${path}`;
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const normalizedContentType = contentType.toLowerCase();
  if (
    !normalizedContentType.includes("application/json") &&
    !normalizedContentType.includes("+json")
  ) {
    return undefined;
  }

  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function apiRequest(
  path: string,
  options: ApiRequestOptions = {},
): Promise<unknown> {
  const { headers: initialHeaders, json, ...init } = options;
  const headers = new Headers(initialHeaders);
  // Caller-supplied headers are the seam for the backend-approved CSRF transport.
  // No CSRF header/cookie name is assumed until that contract is agreed.
  headers.set("Accept", "application/json");
  const method = (init.method ?? "GET").toUpperCase();
  if (!safeMethods.has(method)) {
    const csrfToken = readBrowserCookie(csrfCookieName);
    if (csrfToken) headers.set("x-csrf-token", csrfToken);
  }

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(resolveApiUrl(path), {
      ...init,
      body: json === undefined ? undefined : JSON.stringify(json),
      credentials: "include",
      headers,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw createNetworkError();
  }

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw normalizeApiError(response, payload);
  }

  if (response.status !== 204 && payload === undefined) {
    throw createInvalidResponseError(
      response.status,
      response.headers.get("x-request-id"),
    );
  }

  return payload;
}
