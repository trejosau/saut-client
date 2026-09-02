import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ApiError } from "@/core/lib/api/fetcher";
import { getServerAuthMe, getServerAuthMeWithToken } from "@/modules/auth/server/auth";
import {
  ACCESS_TOKEN_COOKIE,
  EXPIRES_AT_COOKIE,
  REFRESH_CLIENT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
} from "@/modules/auth/server/cookies";
import {
  applySessionCookies,
  clearSessionCookies,
  isSameOriginRequest,
  refreshServerSession,
} from "@/modules/auth/server/session";

type SessionSnapshot = {
  account_id: string;
  session_id: string;
  actor_type: string;
  expires_in_sec: number;
  primary_email?: string | null;
};

function unauthorized() {
  const response = NextResponse.json({ error: "Sesion invalida." }, { status: 401 });
  clearSessionCookies(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function serviceUnavailable() {
  const response = NextResponse.json({ error: "Servicio de sesión temporalmente no disponible." }, { status: 503 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function snapshotFromAuth(
  me: Awaited<ReturnType<typeof getServerAuthMeWithToken>>,
  sessionIdCookie: string,
  expiresAtRaw: number
): SessionSnapshot | null {
  if (!me) return null;
  const sessionId = me.session_id || sessionIdCookie;
  if (!me.account_id || !sessionId) return null;

  const expiresInSec = Number.isFinite(expiresAtRaw) && expiresAtRaw > 0
    ? Math.max(1, Math.floor((expiresAtRaw - Date.now()) / 1000))
    : 900;

  return {
    account_id: me.account_id,
    session_id: sessionId,
    actor_type: me.actor_type || "customer",
    expires_in_sec: expiresInSec,
    primary_email: me.primary_email,
  };
}

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Solicitud de origen no permitido." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value?.trim() ?? "";
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value?.trim() ?? "";
  const refreshClientId = cookieStore.get(REFRESH_CLIENT_COOKIE)?.value?.trim() ?? "";
  const sessionIdCookie = cookieStore.get(SESSION_ID_COOKIE)?.value?.trim() ?? "";
  const expiresAtRaw = Number(cookieStore.get(EXPIRES_AT_COOKIE)?.value ?? "0");

  if (!accessToken && !refreshToken) return unauthorized();

  const current = snapshotFromAuth(
    accessToken ? await getServerAuthMe() : null,
    sessionIdCookie,
    expiresAtRaw
  );
  if (current) {
    const response = NextResponse.json(current, { status: 200 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (!refreshToken) return unauthorized();

  try {
    const refreshed = await refreshServerSession(refreshToken, refreshClientId || undefined);
    if (!refreshed.access_token || !refreshed.refresh_token) return unauthorized();

    const refreshedMe = await getServerAuthMeWithToken(refreshed.access_token);
    const refreshedSnapshot = snapshotFromAuth(refreshedMe, refreshed.session_id, Date.now() + refreshed.expires_in_sec * 1000);
    if (!refreshedSnapshot) return unauthorized();

    const response = NextResponse.json(refreshedSnapshot, { status: 200 });
    applySessionCookies(response, refreshed, refreshClientId || undefined);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof ApiError && (error.retryable || error.status === 0)) return serviceUnavailable();
    return unauthorized();
  }
}
