"use client";

type PendingLogin = {
  email: string;
  delivery: string;
  code?: string;
  resendAfterSec: number;
  expiresAt: number; // epoch ms
  createdAt: number; // epoch ms
};

export type AuthSession = {
  accountId: string;
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  actorType: string;
  expiresAt: number; // epoch ms
  isNewAccount: boolean;
  email?: string;
};

const PENDING_KEY = "saut.auth.pending";
const SESSION_KEY = "saut.auth.session";
const LOGIN_FLAG = "login";
const SESSION_SYNC_COOLDOWN_MS = 8_000;
const COOKIE_TOKEN_PLACEHOLDER = "server-cookie";

const nowMs = () => Date.now();

const isBrowser = typeof window !== "undefined";
let lastSessionSyncAt = 0;
let inFlightSessionSync: Promise<void> | null = null;

function normalizeActorType(value: string | undefined) {
  const normalized = (value ?? "user").trim().toLowerCase();
  return normalized || "user";
}

export function savePendingLogin(input: {
  email: string;
  delivery: string;
  code?: string;
  resendAfterSec: number;
  expiresInSec: number;
}) {
  if (!isBrowser) return;
  const payload: PendingLogin = {
    email: input.email.trim(),
    delivery: input.delivery,
    code: input.code,
    resendAfterSec: input.resendAfterSec,
    createdAt: nowMs(),
    expiresAt: nowMs() + Math.max(input.expiresInSec, 0) * 1000,
  };
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
}

export function getPendingLogin(): PendingLogin | null {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingLogin;
    if (parsed.expiresAt && parsed.expiresAt > nowMs()) {
      return parsed;
    }
  } catch {
    // ignore
  }
  clearPendingLogin();
  return null;
}

export function clearPendingLogin() {
  if (!isBrowser) return;
  window.localStorage.removeItem(PENDING_KEY);
}

function clearClientSessionStorage() {
  if (!isBrowser) return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(PENDING_KEY);
  window.localStorage.setItem(LOGIN_FLAG, "false");
  window.dispatchEvent(new Event("saut:auth"));
}

export function saveSession(input: {
  account_id: string;
  session_id: string;
  access_token: string;
  refresh_token: string;
  actor_type?: string;
  expires_in_sec: number;
  is_new_account: boolean;
  email?: string;
}) {
  if (!isBrowser) return;
  const payload: AuthSession = {
    accountId: input.account_id,
    sessionId: input.session_id,
    accessToken: input.access_token,
    refreshToken: input.refresh_token,
    actorType: normalizeActorType(input.actor_type),
    expiresAt: nowMs() + Math.max(input.expires_in_sec, 0) * 1000,
    isNewAccount: input.is_new_account,
    email: input.email,
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  window.localStorage.setItem(LOGIN_FLAG, "true");
  window.dispatchEvent(new Event("saut:auth"));
}

export function getSession(): AuthSession | null {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed.expiresAt && parsed.expiresAt > nowMs()) {
      return parsed;
    }
  } catch {
    // ignore
  }
  clearSession();
  return null;
}

export function clearSession() {
  if (!isBrowser) return;
  void fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => {
    // ignore logout sync failures
  });
  clearClientSessionStorage();
}

export function isLoggedIn() {
  return getSession() !== null;
}

export function getActorType() {
  return getSession()?.actorType ?? null;
}

export function isAdmin() {
  return getActorType() === "admin";
}

export async function syncServerSession(input: {
  account_id: string;
  session_id: string;
  access_token: string;
  refresh_token: string;
  actor_type?: string;
  expires_in_sec: number;
}) {
  if (!isBrowser) return;

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      account_id: input.account_id,
      session_id: input.session_id,
      access_token: input.access_token,
      refresh_token: input.refresh_token,
      actor_type: normalizeActorType(input.actor_type),
      expires_in_sec: input.expires_in_sec,
    }),
  });

  if (!response.ok) {
    let message = "No se pudo sincronizar la sesion segura.";
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) message = payload.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
}

type ServerSessionSnapshot = {
  account_id?: string;
  session_id?: string;
  actor_type?: string;
  expires_in_sec?: number;
  primary_email?: string | null;
};

export async function syncSessionFromServer(force = false) {
  if (!isBrowser) return;

  const elapsed = nowMs() - lastSessionSyncAt;
  if (!force && elapsed < SESSION_SYNC_COOLDOWN_MS) {
    return;
  }
  if (inFlightSessionSync) {
    return inFlightSessionSync;
  }

  inFlightSessionSync = (async () => {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });

    if (response.status === 401) {
      clearClientSessionStorage();
      return;
    }
    if (!response.ok) {
      throw new Error("No se pudo sincronizar la sesion.");
    }

    const payload = (await response.json()) as ServerSessionSnapshot;
    const accountId = String(payload.account_id ?? "").trim();
    const sessionId = String(payload.session_id ?? "").trim();
    const expiresInSec = Number(payload.expires_in_sec ?? 0);

    if (!accountId || !sessionId || expiresInSec <= 0) {
      throw new Error("Sesion invalida desde servidor.");
    }

    saveSession({
      account_id: accountId,
      session_id: sessionId,
      access_token: COOKIE_TOKEN_PLACEHOLDER,
      refresh_token: COOKIE_TOKEN_PLACEHOLDER,
      actor_type: payload.actor_type,
      expires_in_sec: expiresInSec,
      is_new_account: false,
      email: payload.primary_email ?? undefined,
    });
  })()
    .finally(() => {
      lastSessionSyncAt = nowMs();
      inFlightSessionSync = null;
    });

  return inFlightSessionSync;
}
