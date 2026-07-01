import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  ACCOUNT_ID_COOKIE,
  ACTOR_TYPE_COOKIE,
  EXPIRES_AT_COOKIE,
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
};

export function normalizeActorType(value: string | undefined) {
  const normalized = (value ?? "user").trim().toLowerCase();
  return normalized || "user";
}

export function applySessionCookies(
  response: NextResponse,
  payload: ServerSessionPayload
) {
  const safeExpiresInSec = Math.min(
    Math.max(Math.floor(payload.expires_in_sec), 60),
    60 * 60 * 24 * 30
  );
  const secure = process.env.NODE_ENV === "production";
  const expiresAtMs = Date.now() + safeExpiresInSec * 1000;

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
    maxAge: 60 * 60 * 24 * 30,
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
