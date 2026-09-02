import { NextRequest, NextResponse } from "next/server";

import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/modules/auth/server/cookies";

const API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

function copyJsonResponse(response: Response, bodyText: string) {
  const contentType = response.headers.get("content-type") ?? "application/json";
  return new NextResponse(bodyText, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

export async function forwardSupportRequest(
  request: NextRequest,
  path: string,
  init?: {
    method?: "GET" | "POST";
    body?: unknown;
  }
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value?.trim() ?? "";
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: init?.method ?? request.method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body:
      init?.body === undefined || (init?.method ?? request.method) === "GET"
        ? undefined
        : JSON.stringify(init.body),
  });

  const bodyText = await response.text().catch(() => "");
  return copyJsonResponse(response, bodyText);
}
