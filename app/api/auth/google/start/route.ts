import { NextResponse } from "next/server";

import { requestJson } from "@/core/lib/api/fetcher";
import {
  getAuthApiBaseUrl,
  sanitizeReturnTo,
} from "@/modules/auth/server/google";
import { GOOGLE_STATE_COOKIE } from "@/modules/auth/server/cookies";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = sanitizeReturnTo(url.searchParams.get("return_to"), url.origin);
  const target = new URL("/auth/google/start", getAuthApiBaseUrl());
  target.searchParams.set("return_to", returnTo);

  try {
    const result = await requestJson<{ authorization_url?: unknown; state?: unknown }>(target, {
      method: "GET",
      cache: "no-store",
    });
    const authorizationUrl = typeof result.authorization_url === "string" ? result.authorization_url : "";
    const state = typeof result.state === "string" ? result.state : "";
    if (!authorizationUrl || !state) {
      return NextResponse.json({ error: "No se pudo iniciar Google login." }, { status: 502 });
    }

    const response = NextResponse.redirect(authorizationUrl, { status: 302 });
    response.cookies.set(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar Google login." }, { status: 502 });
  }
}
