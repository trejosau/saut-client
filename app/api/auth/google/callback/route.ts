import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { requestJson } from "@/core/lib/api/fetcher";
import {
  getAuthApiBaseUrl,
  getAuthInternalApiKey,
  sanitizeReturnTo,
} from "@/modules/auth/server/google";
import { GOOGLE_STATE_COOKIE } from "@/modules/auth/server/cookies";
import {
  applySessionCookies,
  type ServerSessionPayload,
} from "@/modules/auth/server/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const ticket = incoming.searchParams.get("ticket")?.trim() ?? "";
  const state = incoming.searchParams.get("state")?.trim() ?? "";
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value?.trim() ?? "";

  const clearStateCookie = (response: NextResponse) => {
    response.cookies.set(GOOGLE_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  if (!ticket || !state || !expectedState || state !== expectedState) {
    return clearStateCookie(NextResponse.redirect(new URL("/", incoming.origin), { status: 303 }));
  }

  let payload: ServerSessionPayload;
  try {
    payload = await requestJson<ServerSessionPayload>(
      `${getAuthApiBaseUrl().replace(/\/$/, "")}/auth/google/consume`,
      {
        method: "POST",
        headers: { "x-internal-api-key": getAuthInternalApiKey() },
        json: { ticket, state },
        cache: "no-store",
      }
    );
  } catch {
    return clearStateCookie(NextResponse.redirect(new URL("/", incoming.origin), { status: 303 }));
  }

  const redirectTo = sanitizeReturnTo(payload.return_to ?? "/", incoming.origin);
  const response = NextResponse.redirect(new URL(redirectTo, incoming.origin), { status: 303 });
  applySessionCookies(response, payload);
  return clearStateCookie(response);
}
