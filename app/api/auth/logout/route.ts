import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/modules/auth/server/cookies";

export async function POST() {
  const secure = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true }, { status: 200 });
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

  return response;
}
