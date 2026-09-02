import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getServerAuthMe } from "@/modules/auth/server/auth";
import {
  ACCESS_TOKEN_COOKIE,
} from "@/modules/auth/server/cookies";
import { clearSessionCookies } from "@/modules/auth/server/session";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    const response = NextResponse.json({ error: "No autenticado." }, { status: 401 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const me = await getServerAuthMe();
  if (!me) {
    const response = NextResponse.json({ error: "Sesion invalida." }, { status: 401 });
    clearSessionCookies(response);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const response = NextResponse.json(me, { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
