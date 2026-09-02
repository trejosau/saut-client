import { cookies } from "next/headers";

import { requestJson } from "@/core/lib/api/fetcher";
import { ApiError } from "@/core/lib/api/errors";
import { getServerApiBaseUrl } from "@/core/lib/config/env";
import { ACCESS_TOKEN_COOKIE } from "@/modules/auth/server/cookies";

export type AdminRequestInit = RequestInit & {
  path: string;
};

export async function adminRequest<T>(init: AdminRequestInit): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    throw new ApiError("No autenticado para dashboard.", {
      status: 401,
      code: "UNAUTHENTICATED",
    });
  }

  const { path, ...requestInit } = init;
  const baseUrl = getServerApiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("http://") || path.startsWith("https://")
    ? path
    : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  return requestJson<T>(normalizedPath, {
    ...requestInit,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

