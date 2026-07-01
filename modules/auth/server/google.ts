import type { ServerSessionPayload } from "@/modules/auth/server/session";
import { normalizeActorType } from "@/modules/auth/server/session";

const API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const SESSION_STORAGE_KEY = "saut.auth.session";
const PENDING_STORAGE_KEY = "saut.auth.pending";
const LOGIN_FLAG_KEY = "login";

export type GoogleExchangeResponse = ServerSessionPayload & {
  is_new_account: boolean;
  primary_email?: string | null;
  return_to?: string | null;
};

export function getAuthApiBaseUrl() {
  return API_BASE_URL;
}

export function buildGoogleCallbackRedirectUri() {
  const url = new URL("/api/auth/google/callback", getAuthApiBaseUrl());
  if (
    url.hostname === "0.0.0.0" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]" ||
    url.hostname === "::1"
  ) {
    url.hostname = "localhost";
  }
  return `${url.origin}${url.pathname}`;
}

export function sanitizeReturnTo(rawValue: string | null, origin: string) {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) return "/";

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.origin !== origin) return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function renderGoogleSuccessHtml(
  payload: GoogleExchangeResponse,
  redirectTo: string
) {
  const serialized = serializeForInlineScript({
    redirectTo,
    session: {
      accountId: payload.account_id,
      sessionId: payload.session_id,
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      actorType: normalizeActorType(payload.actor_type),
      expiresInSec: payload.expires_in_sec,
      isNewAccount: payload.is_new_account,
      email: payload.primary_email ?? undefined,
    },
  });

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Cache-Control" content="no-store" />
    <title>Completando acceso</title>
  </head>
  <body style="margin:0;font-family:system-ui,sans-serif;background:#f3efdf;color:#111827;">
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;">
      <section style="max-width:420px;border:1px solid rgba(17,24,39,.12);border-radius:20px;background:rgba(255,255,255,.82);padding:24px;box-shadow:0 24px 60px rgba(17,24,39,.12);">
        <h1 style="margin:0 0 8px;font-size:24px;">Completando acceso con Google</h1>
        <p style="margin:0;color:rgba(17,24,39,.72);">Estamos cerrando tu sesión segura y redirigiéndote.</p>
      </section>
    </main>
    <script>
      (() => {
        const payload = ${serialized};
        const expiresAt = Date.now() + Math.max(payload.session.expiresInSec, 0) * 1000;
        const session = {
          accountId: payload.session.accountId,
          sessionId: payload.session.sessionId,
          accessToken: payload.session.accessToken,
          refreshToken: payload.session.refreshToken,
          actorType: payload.session.actorType,
          expiresAt,
          isNewAccount: payload.session.isNewAccount,
          email: payload.session.email,
        };

        try {
          window.localStorage.setItem("${SESSION_STORAGE_KEY}", JSON.stringify(session));
          window.localStorage.removeItem("${PENDING_STORAGE_KEY}");
          window.localStorage.setItem("${LOGIN_FLAG_KEY}", "true");
          window.dispatchEvent(new Event("saut:auth"));
        } catch {
          // ignore localStorage sync failures
        }

        window.location.replace(payload.redirectTo || "/");
      })();
    </script>
  </body>
</html>`;
}

export function renderGoogleErrorHtml(message: string, redirectTo: string) {
  const serialized = serializeForInlineScript({ message, redirectTo });

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Cache-Control" content="no-store" />
    <title>Google login</title>
  </head>
  <body style="margin:0;font-family:system-ui,sans-serif;background:#f3efdf;color:#111827;">
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;">
      <section style="max-width:440px;border:1px solid rgba(17,24,39,.12);border-radius:20px;background:rgba(255,255,255,.86);padding:24px;box-shadow:0 24px 60px rgba(17,24,39,.12);">
        <h1 style="margin:0 0 8px;font-size:24px;">No se pudo iniciar con Google</h1>
        <p id="message" style="margin:0 0 16px;color:rgba(17,24,39,.72);">${escapeHtml(
          message
        )}</p>
        <a id="return-link" href="${escapeHtml(
          redirectTo
        )}" style="display:inline-flex;align-items:center;justify-content:center;height:44px;padding:0 18px;border-radius:999px;background:#111827;color:#fff;text-decoration:none;font-weight:700;">Volver</a>
      </section>
    </main>
    <script>
      (() => {
        const payload = ${serialized};
        try {
          window.localStorage.removeItem("${PENDING_STORAGE_KEY}");
        } catch {
          // ignore localStorage sync failures
        }
        const message = document.getElementById("message");
        const link = document.getElementById("return-link");
        if (message) message.textContent = payload.message;
        if (link) link.setAttribute("href", payload.redirectTo || "/");
      })();
    </script>
  </body>
</html>`;
}

function serializeForInlineScript(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
