import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { requestJson } from "@/core/lib/api/fetcher";
import { getServerApiBaseUrl } from "@/core/lib/config/env";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/modules/auth/server/cookies";
import { clearSessionCookies, isSameOriginRequest } from "@/modules/auth/server/session";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Solicitud de origen no permitido." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value?.trim() ?? "";
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value?.trim() ?? "";

  if (accessToken || refreshToken) {
    try {
      await requestJson<unknown>(
        `${getServerApiBaseUrl().replace(/\/$/, "")}/auth/session/revoke`,
        {
          method: "POST",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          json: refreshToken ? { refresh_token: refreshToken } : {},
          cache: "no-store",
        }
      );
    } catch {
      // The browser must still lose its cookies when the API is unavailable.
    }
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearSessionCookies(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
