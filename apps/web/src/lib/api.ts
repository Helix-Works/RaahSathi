const apiBasePath = "/api/v1";

export async function apiFetch(path: string, init: RequestInit = {}) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("API paths must be same-origin paths beginning with one slash.");
  }

  return fetch(`${apiBasePath}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });
}
