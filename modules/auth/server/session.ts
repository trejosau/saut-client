import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { requestJson } from "@/core/lib/api/fetcher";
import { getServerApiBaseUrl } from "@/core/lib/config/env";
import {
  ACCESS_TOKEN_COOKIE,
  ACCOUNT_ID_COOKIE,
  ACTOR_TYPE_COOKIE,
  AUTH_COOKIE_NAMES,
  EXPIRES_AT_COOKIE,
  REFRESH_CLIENT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
} from "@/modules/auth/server/cookies";

export type ServerSessionPayload = {
  account_id: string;
  session_id: string;
  access_token: string;
  refresh_token: string;
  actor_type?: string;
  expires_in_sec: number;
  session_expires_in_sec?: number;
  is_new_account?: boolean;
  primary_email?: string | null;
  return_to?: string | null;
};

export type PublicSessionPayload = {
  account_id: string;
  session_id: string;
  actor_type: string;
  expires_in_sec: number;
  session_expires_in_sec?: number;
  is_new_account?: boolean;
  primary_email?: string | null;
  return_to?: string | null;
};

export function normalizeActorType(value: string | undefined) {
  const normalized = (value ?? "user").trim().toLowerCase();
  return normalized || "user";
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  return request.headers.get("sec-fetch-site") !== "cross-site";
}

export function applySessionCookies(
  response: NextResponse,
  payload: ServerSessionPayload,
  refreshClientId?: string
) {
  const accessTtl = Number(payload.expires_in_sec);
  const safeExpiresInSec = Math.min(
    Math.max(Number.isFinite(accessTtl) ? Math.floor(accessTtl) : 900, 60),
    60 * 60 * 24 * 30
  );
  const secure = process.env.NODE_ENV === "production";
  const expiresAtMs = Date.now() + safeExpiresInSec * 1000;
  const sessionTtl = Number(payload.session_expires_in_sec);
  const safeSessionExpiresInSec = Math.min(
    Math.max(Number.isFinite(sessionTtl) ? Math.floor(sessionTtl) : 60 * 60 * 24 * 30, 60),
    60 * 60 * 24 * 30
  );
  const clientId = /^[A-Za-z0-9_-]{16,128}$/.test(refreshClientId ?? "")
    ? refreshClientId as string
    : randomUUID();

  const baseCookie = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
  };

  response.cookies.set(ACCESS_TOKEN_COOKIE, payload.access_token, {
    ...baseCookie,
    maxAge: safeExpiresInSec,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, payload.refresh_token, {
    ...baseCookie,
    maxAge: safeSessionExpiresInSec,
  });
  response.cookies.set(REFRESH_CLIENT_COOKIE, clientId, {
    ...baseCookie,
    maxAge: safeSessionExpiresInSec,
  });
  response.cookies.set(ACCOUNT_ID_COOKIE, payload.account_id, {
    ...baseCookie,
    maxAge: safeExpiresInSec,
  });
  response.cookies.set(SESSION_ID_COOKIE, payload.session_id, {
    ...baseCookie,
    maxAge: safeExpiresInSec,
  });
  response.cookies.set(ACTOR_TYPE_COOKIE, normalizeActorType(payload.actor_type), {
    ...baseCookie,
    maxAge: safeExpiresInSec,
  });
  response.cookies.set(EXPIRES_AT_COOKIE, String(expiresAtMs), {
    ...baseCookie,
    maxAge: safeExpiresInSec,
  });
}

export function clearSessionCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  const clearCookie = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  for (const cookieName of AUTH_COOKIE_NAMES) {
    response.cookies.set(cookieName, "", clearCookie);
  }
}

export function toPublicSessionPayload(payload: ServerSessionPayload): PublicSessionPayload {
  return {
    account_id: payload.account_id,
    session_id: payload.session_id,
    actor_type: normalizeActorType(payload.actor_type),
    expires_in_sec: payload.expires_in_sec,
    ...(payload.session_expires_in_sec === undefined
      ? {}
      : { session_expires_in_sec: payload.session_expires_in_sec }),
    ...(payload.is_new_account === undefined ? {} : { is_new_account: payload.is_new_account }),
    ...(payload.primary_email === undefined ? {} : { primary_email: payload.primary_email }),
    ...(payload.return_to === undefined ? {} : { return_to: payload.return_to }),
  };
}

export function refreshServerSession(refreshToken: string, refreshClientId?: string) {
  return requestJson<ServerSessionPayload>(
    `${getServerApiBaseUrl().replace(/\/$/, "")}/auth/token/refresh`,
    {
      method: "POST",
      headers: refreshClientId ? { "X-Refresh-Client": refreshClientId } : undefined,
      json: { refresh_token: refreshToken },
      cache: "no-store",
    }
  );
}
