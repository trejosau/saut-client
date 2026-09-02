import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getServerApiBaseUrl } from "@/core/lib/config/env";
import { ACCESS_TOKEN_COOKIE } from "@/modules/auth/server/cookies";

function unauthorized() {
  const response = NextResponse.json({ error: "No autenticado." }, { status: 401 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value?.trim() ?? "";
  if (!accessToken) return unauthorized();

  const url = new URL("/analytics/map/pings", getServerApiBaseUrl());
  url.search = request.nextUrl.search;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
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
