import { NextRequest, NextResponse } from "next/server";

import { getServerAuthMe } from "@/modules/auth/server/auth";

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
  const me = await getServerAuthMe();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: init?.method ?? request.method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(me
        ? {
            "x-account-id": me.account_id,
            "x-actor-type": me.actor_type,
          }
        : {}),
    },
    body:
      init?.body === undefined || (init?.method ?? request.method) === "GET"
        ? undefined
        : JSON.stringify(init.body),
  });

  const bodyText = await response.text().catch(() => "");
  return copyJsonResponse(response, bodyText);
}
