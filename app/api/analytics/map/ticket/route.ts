import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getServerApiBaseUrl } from "@/core/lib/config/env";
import { getAuthInternalApiKey } from "@/modules/auth/server/google";
import { ACCESS_TOKEN_COOKIE } from "@/modules/auth/server/cookies";
import { isSameOriginRequest } from "@/modules/auth/server/session";

function unauthorized() {
  const response = NextResponse.json({ error: "No autenticado." }, { status: 401 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Solicitud de origen no permitido." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value?.trim() ?? "";
  if (!accessToken) return unauthorized();

  const response = await fetch(`${getServerApiBaseUrl().replace(/\/$/, "")}/internal/analytics/ws-ticket`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "x-internal-api-key": getAuthInternalApiKey(),
    },
    cache: "no-store",
  });
  const result = new NextResponse(await response.text(), { status: response.status });
  const contentType = response.headers.get("content-type");
  const requestId = response.headers.get("x-request-id");
  if (contentType) result.headers.set("content-type", contentType);
  if (requestId) result.headers.set("x-request-id", requestId);
  result.headers.set("Cache-Control", "no-store");
  return result;
}
