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

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const me = await getServerAuthMe();
  if (!me) {
    const response = NextResponse.json({ error: "Sesion invalida." }, { status: 401 });
    const secure = process.env.NODE_ENV === "production";
    const clearCookie = {
      httpOnly: true,
      secure,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    };

    response.cookies.set(ACCESS_TOKEN_COOKIE, "", clearCookie);
    response.cookies.set(REFRESH_TOKEN_COOKIE, "", clearCookie);
    response.cookies.set(ACCOUNT_ID_COOKIE, "", clearCookie);
    response.cookies.set(SESSION_ID_COOKIE, "", clearCookie);
    response.cookies.set(ACTOR_TYPE_COOKIE, "", clearCookie);
    response.cookies.set(EXPIRES_AT_COOKIE, "", clearCookie);
    return response;
  }

  return NextResponse.json(me, { status: 200 });
}
