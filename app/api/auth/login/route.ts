import { NextResponse } from "next/server";

import {
  applySessionCookies,
  normalizeActorType,
} from "@/modules/auth/server/session";

type LoginPayload = {
  account_id?: string;
  session_id?: string;
  access_token?: string;
  refresh_token?: string;
  actor_type?: string;
  expires_in_sec?: number;
};

export async function POST(request: Request) {
  let payload: LoginPayload;
  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const accountId = String(payload.account_id ?? "").trim();
  const sessionId = String(payload.session_id ?? "").trim();
  const accessToken = String(payload.access_token ?? "").trim();
  const refreshToken = String(payload.refresh_token ?? "").trim();
  const expiresInSec = Number(payload.expires_in_sec ?? 0);
  const actorType = normalizeActorType(payload.actor_type);

  if (!accountId || !sessionId || !accessToken || !refreshToken || expiresInSec <= 0) {
    return NextResponse.json({ error: "Payload de sesion invalido." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  applySessionCookies(response, {
    account_id: accountId,
    session_id: sessionId,
    access_token: accessToken,
    refresh_token: refreshToken,
    actor_type: actorType,
    expires_in_sec: expiresInSec,
  });

  return response;
}
