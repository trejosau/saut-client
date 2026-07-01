import { getPublicApiBaseUrl } from "@/core/lib/config/env";

export type QueryValue = string | number | boolean | null | undefined;

export function normalizeApiPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function buildApiUrl(
  path: string,
  query?: Record<string, QueryValue>,
  baseUrl = getPublicApiBaseUrl()
): string {
  const url = new URL(`${baseUrl}${normalizeApiPath(path)}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && String(value).length > 0) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}
