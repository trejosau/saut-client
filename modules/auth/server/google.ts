import type { ServerSessionPayload } from "@/modules/auth/server/session";

const API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

export type GoogleExchangeResponse = ServerSessionPayload & {
  is_new_account: boolean;
  primary_email?: string | null;
  return_to?: string | null;
};

export function getAuthApiBaseUrl() {
  return API_BASE_URL;
}

export function sanitizeReturnTo(rawValue: string | null, origin: string) {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) return "/";

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.origin !== origin) return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}
