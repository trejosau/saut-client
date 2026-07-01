import { afterEach, describe, expect, it, vi } from "vitest";

import { requestJson } from "./fetcher";

describe("requestJson", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends JSON with no-store and returns the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJson<{ ok: boolean }>("/api/test", {
      method: "POST",
      json: { name: "SAUT" },
    })).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith("/api/test", expect.objectContaining({
      body: JSON.stringify({ name: "SAUT" }),
      cache: "no-store",
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    }));
  });

  it("returns undefined for a no-content response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(requestJson<void>("/api/test")).resolves.toBeUndefined();
  });

  it("uses the structured API error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: "Solicitud inválida" }),
      { status: 400, headers: { "content-type": "application/json" } }
    )));

    await expect(requestJson("/api/test")).rejects.toThrow("Solicitud inválida");
  });

  it("falls back to status when an error body is unreadable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    await expect(requestJson("/api/test")).rejects.toThrow("Request failed (503)");
  });
});
