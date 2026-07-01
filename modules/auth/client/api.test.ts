import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildGoogleLoginUrl,
  getGoogleLoginUnavailableReason,
  startEmailLogin,
  verifyEmailLogin,
} from "./api";

describe("auth client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts normalized auth commands and returns JSON", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "sent" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ account_id: "account-1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(startEmailLogin("user@example.com")).resolves.toEqual({ status: "sent" });
    await expect(verifyEmailLogin("user@example.com", "123456")).resolves.toEqual({ account_id: "account-1" });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/auth/email/verify"), expect.objectContaining({
      body: JSON.stringify({ email: "user@example.com", code: "123456" }),
    }));
  });

  it("surfaces structured server errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: "Código inválido" }), { status: 401 }
    )));
    await expect(verifyEmailLogin("user@example.com", "000000")).rejects.toThrow("Código inválido");
  });

  it("detects embedded browsers and builds a safe Google URL", () => {
    expect(getGoogleLoginUnavailableReason("Instagram 300")).toMatch(/Chrome o Safari/);
    expect(getGoogleLoginUnavailableReason("Mozilla/5.0 Chrome/120")).toBeNull();
    expect(buildGoogleLoginUrl("/catalogo?drop=1").toString()).toContain("return_to=%2Fcatalogo%3Fdrop%3D1");
  });
});
