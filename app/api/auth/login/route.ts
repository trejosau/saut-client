import { NextResponse } from "next/server";

import { ApiError, requestJson } from "@/core/lib/api/fetcher";
import { getServerApiBaseUrl } from "@/core/lib/config/env";
import {
  applySessionCookies,
  isSameOriginRequest,
  toPublicSessionPayload,
  type ServerSessionPayload,
} from "@/modules/auth/server/session";

type LoginPayload = {
  email?: unknown;
  code?: unknown;
};

function backendError(error: unknown) {
  if (error instanceof ApiError) {
    const status = [400, 401, 403, 404, 409, 422, 429].includes(error.status)
      ? error.status
      : 502;
    return NextResponse.json(
      { error: "request_error", code: error.code, message: error.message },
      { status }
    );
  }
  return NextResponse.json(
    { error: "request_error", code: "SERVICE_UNAVAILABLE", message: "No se pudo iniciar sesión." },
    { status: 502 }
  );
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Solicitud de origen no permitido." }, { status: 403 });
  }

  let payload: LoginPayload;
  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const code = typeof payload.code === "string" ? payload.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Correo y código inválidos." }, { status: 400 });
  }

  let session: ServerSessionPayload;
  try {
    session = await requestJson<ServerSessionPayload>(
      `${getServerApiBaseUrl().replace(/\/$/, "")}/auth/email/verify`,
      {
        method: "POST",
        json: { email, code },
        cache: "no-store",
      }
    );
  } catch (error) {
    return backendError(error);
  }

  const response = NextResponse.json(toPublicSessionPayload(session), { status: 200 });
  applySessionCookies(response, session);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
