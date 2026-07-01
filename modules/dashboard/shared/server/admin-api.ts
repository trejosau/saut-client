import { cookies } from "next/headers";

import { getServerApiBaseUrl } from "@/core/lib/config/env";
import { ACCESS_TOKEN_COOKIE } from "@/modules/auth/server/cookies";

const API_BASE_URL = getServerApiBaseUrl();

type AdminRequestInit = RequestInit & {
  path: string;
};

export async function adminRequest<T>(init: AdminRequestInit): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    throw new Error("No autenticado para dashboard.");
  }

  const response = await fetch(`${API_BASE_URL}${init.path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Admin API error (${response.status})${body ? `: ${body}` : ""}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text().catch(() => "");
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

