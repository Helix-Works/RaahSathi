import {
  createInvalidResponseError,
  createNetworkError,
  normalizeApiError,
} from "./errors";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"
).replace(/\/+$/, "");

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

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { headers: initialHeaders, json, ...init } = options;
  const headers = new Headers(initialHeaders);
  // Caller-supplied headers are the seam for the backend-approved CSRF transport.
  // No CSRF header/cookie name is assumed until that contract is agreed.
  headers.set("Accept", "application/json");

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
      response.headers.get("x-correlation-id"),
    );
  }

  return payload as T;
}
