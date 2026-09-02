"use client";

import { ApiError } from "@/core/lib/api/errors";
import { requestJson } from "@/core/lib/api/fetcher";

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
  actorType: string;
  expiresAt: number; // epoch ms
  isNewAccount: boolean;
  email?: string;
};

const PENDING_KEY = "saut.auth.pending";
const SESSION_KEY = "saut.auth.session";
const LOGIN_FLAG = "login";
const SESSION_SYNC_COOLDOWN_MS = 8_000;

const nowMs = () => Date.now();

const isBrowser = typeof window !== "undefined";
let lastSessionSyncAt = 0;
let inFlightSessionSync: Promise<void> | null = null;

function normalizeActorType(value: string | undefined) {
  const normalized = (value ?? "user").trim().toLowerCase();
  return normalized || "user";
}

function getSessionStorage(): Storage | null {
  if (!isBrowser) return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLocalStorage(): Storage | null {
  if (!isBrowser) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function removeStoredValue(storage: Storage | null, key: string) {
  try {
    storage?.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

function setStoredValue(storage: Storage | null, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    // ignore storage failures
  }
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
  setStoredValue(getSessionStorage(), PENDING_KEY, JSON.stringify(payload));
}

export function getPendingLogin(): PendingLogin | null {
  if (!isBrowser) return null;
  const storage = getSessionStorage();
  let raw: string | null = null;
  try {
    raw = storage?.getItem(PENDING_KEY) ?? null;
  } catch {
    return null;
  }
  if (!raw) {
    removeStoredValue(getLocalStorage(), PENDING_KEY);
    return null;
  }
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
  removeStoredValue(getSessionStorage(), PENDING_KEY);
  removeStoredValue(getLocalStorage(), PENDING_KEY);
}

function clearClientSessionStorage(notifyOtherTabs = true) {
  if (!isBrowser) return;
  removeStoredValue(getSessionStorage(), SESSION_KEY);
  removeStoredValue(getLocalStorage(), SESSION_KEY);
  clearPendingLogin();
  if (notifyOtherTabs) setStoredValue(getLocalStorage(), LOGIN_FLAG, "false");
  window.dispatchEvent(new Event("saut:auth"));
}

export function saveSession(input: {
  account_id: string;
  session_id: string;
  actor_type?: string;
  expires_in_sec: number;
  is_new_account: boolean;
  email?: string;
  // Accepted for compatibility with older callers; never persisted client-side.
  access_token?: string;
  refresh_token?: string;
}) {
  if (!isBrowser) return;
  const payload: AuthSession = {
    accountId: input.account_id,
    sessionId: input.session_id,
    actorType: normalizeActorType(input.actor_type),
    expiresAt: nowMs() + Math.max(input.expires_in_sec, 0) * 1000,
    isNewAccount: input.is_new_account,
    email: input.email,
  };
  setStoredValue(getSessionStorage(), SESSION_KEY, JSON.stringify(payload));
  removeStoredValue(getLocalStorage(), SESSION_KEY);
  setStoredValue(getLocalStorage(), LOGIN_FLAG, "true");
  window.dispatchEvent(new Event("saut:auth"));
}

function readStoredSession(): string | null {
  const sessionStorage = getSessionStorage();
  try {
    const current = sessionStorage?.getItem(SESSION_KEY) ?? null;
    if (current) return current;
  } catch {
    return null;
  }

  const legacyStorage = getLocalStorage();
  try {
    const legacy = legacyStorage?.getItem(SESSION_KEY) ?? null;
    if (legacy) {
      removeStoredValue(legacyStorage, SESSION_KEY);
      return legacy;
    }
  } catch {
    return null;
  }
  return null;
}

export function getSession(): AuthSession | null {
  if (!isBrowser) return null;
  const raw = readStoredSession();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    const accountId = String(parsed.accountId ?? "").trim();
    const sessionId = String(parsed.sessionId ?? "").trim();
    const expiresAt = Number(parsed.expiresAt ?? 0);
    if (!accountId || !sessionId || !Number.isFinite(expiresAt) || expiresAt <= nowMs()) {
      clearSession();
      return null;
    }

    const safeSession: AuthSession = {
      accountId,
      sessionId,
      actorType: normalizeActorType(parsed.actorType),
      expiresAt,
      isNewAccount: parsed.isNewAccount === true,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
    };
    setStoredValue(getSessionStorage(), SESSION_KEY, JSON.stringify(safeSession));
    return safeSession;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  if (!isBrowser) return;
  void requestJson<unknown>("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => {
    // ignore logout sync failures
  }).finally(() => {
    // Re-emit after the server has processed logout so other tabs do not
    // restore a session during the revocation request.
    setStoredValue(getLocalStorage(), LOGIN_FLAG, `false:${nowMs()}`);
  });
  clearClientSessionStorage(false);
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
    let payload: ServerSessionSnapshot;
    try {
      payload = await requestJson<ServerSessionSnapshot>("/api/auth/session", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearClientSessionStorage();
        return;
      }
      throw error;
    }
    const accountId = String(payload.account_id ?? "").trim();
    const sessionId = String(payload.session_id ?? "").trim();
    const expiresInSec = Number(payload.expires_in_sec ?? 0);

    if (!accountId || !sessionId || expiresInSec <= 0) {
      throw new Error("Sesion invalida desde servidor.");
    }

    saveSession({
      account_id: accountId,
      session_id: sessionId,
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
