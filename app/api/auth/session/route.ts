import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getServerAuthMe } from "@/modules/auth/server/auth";
import {
  ACCESS_TOKEN_COOKIE,
  ACCOUNT_ID_COOKIE,
  ACTOR_TYPE_COOKIE,
  EXPIRES_AT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
} from "@/modules/auth/server/cookies";

type SessionSnapshot = {
  account_id: string;
  session_id: string;
  actor_type: string;
  expires_in_sec: number;
  primary_email?: string | null;
};

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value?.trim() ?? "";
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value?.trim() ?? "";
  const accountIdCookie = cookieStore.get(ACCOUNT_ID_COOKIE)?.value?.trim() ?? "";
  const sessionIdCookie = cookieStore.get(SESSION_ID_COOKIE)?.value?.trim() ?? "";
  const actorTypeCookie = cookieStore.get(ACTOR_TYPE_COOKIE)?.value?.trim() ?? "";
  const expiresAtRaw = Number(cookieStore.get(EXPIRES_AT_COOKIE)?.value ?? "0");

  if (!accessToken || !refreshToken || !accountIdCookie || !sessionIdCookie) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const me = await getServerAuthMe();
  if (!me) {
    return NextResponse.json({ error: "Sesion invalida." }, { status: 401 });
  }

  const expiresInSec = Number.isFinite(expiresAtRaw)
    ? Math.max(60, Math.floor((expiresAtRaw - Date.now()) / 1000))
    : 900;

  const payload: SessionSnapshot = {
    account_id: me.account_id || accountIdCookie,
    session_id: sessionIdCookie,
    actor_type: actorTypeCookie || me.actor_type || "customer",
    expires_in_sec: expiresInSec,
    primary_email: me.primary_email,
  };

  return NextResponse.json(payload, { status: 200 });
}
