import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requestJson } = vi.hoisted(() => ({
  requestJson: vi.fn(),
}));

vi.mock("@/core/lib/api/fetcher", () => ({ requestJson }));

import {
  clearPendingLogin,
  clearSession,
  getPendingLogin,
  getSession,
  savePendingLogin,
  saveSession,
  syncSessionFromServer,
} from "@/modules/auth/client/session";

describe("browser auth session storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    requestJson.mockResolvedValue(undefined);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("stores only non-sensitive session metadata, never bearer tokens", () => {
    saveSession({
      account_id: "account-1",
      session_id: "session-1",
      actor_type: "customer",
      expires_in_sec: 900,
      is_new_account: false,
      email: "user@example.com",
      access_token: "access-secret",
      refresh_token: "refresh-secret",
    });

    const stored = JSON.parse(sessionStorage.getItem("saut.auth.session") ?? "null") as Record<string, unknown>;
    expect(stored).toEqual(expect.objectContaining({ accountId: "account-1", sessionId: "session-1" }));
    expect(stored).not.toHaveProperty("accessToken");
    expect(stored).not.toHaveProperty("refreshToken");
    expect(localStorage.getItem("saut.auth.session")).toBeNull();
    expect(getSession()).toEqual(expect.objectContaining({ accountId: "account-1", actorType: "customer" }));
  });

  it("removes legacy localStorage session records while preserving safe metadata", () => {
    localStorage.setItem("saut.auth.session", JSON.stringify({
      accountId: "account-1",
      sessionId: "session-1",
      accessToken: "old-access-secret",
      refreshToken: "old-refresh-secret",
      actorType: "customer",
      expiresAt: Date.now() + 60_000,
      isNewAccount: false,
    }));

    expect(getSession()).toEqual(expect.objectContaining({ accountId: "account-1" }));
    expect(localStorage.getItem("saut.auth.session")).toBeNull();
    const migrated = JSON.parse(sessionStorage.getItem("saut.auth.session") ?? "null") as Record<string, unknown>;
    expect(migrated).not.toHaveProperty("accessToken");
    expect(migrated).not.toHaveProperty("refreshToken");
  });

  it("keeps the pending code in tab-scoped storage and syncs server metadata", async () => {
    savePendingLogin({ email: "user@example.com", delivery: "dev", code: "123456", resendAfterSec: 30, expiresInSec: 600 });
    expect(getPendingLogin()?.code).toBe("123456");
    expect(localStorage.getItem("saut.auth.pending")).toBeNull();

    requestJson.mockResolvedValueOnce({
      account_id: "account-2",
      session_id: "session-2",
      actor_type: "admin",
      expires_in_sec: 900,
      primary_email: "admin@example.com",
    });
    await syncSessionFromServer(true);

    expect(getSession()).toEqual(expect.objectContaining({
      accountId: "account-2",
      actorType: "admin",
      email: "admin@example.com",
    }));
    clearPendingLogin();
    expect(getPendingLogin()).toBeNull();
  });

  it("requests server revocation before clearing local metadata on logout", () => {
    saveSession({
      account_id: "account-1",
      session_id: "session-1",
      expires_in_sec: 900,
      is_new_account: false,
    });

    clearSession();

    expect(requestJson).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
    }));
    expect(getSession()).toBeNull();
  });
});
