import { afterEach, describe, expect, it } from "vitest";

import { getAnalyticsWsUrl, getPublicApiBaseUrl, getServerApiBaseUrl } from "./env";

const originalEnvironment = { ...process.env };

describe("client environment", () => {
  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it("uses safe local defaults", () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.API_BASE_URL;
    delete process.env.INTERNAL_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_ANALYTICS_WS_URL;

    expect(getPublicApiBaseUrl()).toBe("http://localhost:8080");
    expect(getServerApiBaseUrl()).toBe("http://localhost:8080");
    expect(getAnalyticsWsUrl()).toBe("ws://localhost:8080/ws/map");
  });

  it("honors explicit public and internal endpoints", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = " https://api.saut.mx ";
    process.env.INTERNAL_API_BASE_URL = "http://api.internal:8080";
    process.env.NEXT_PUBLIC_ANALYTICS_WS_URL = "wss://api.saut.mx/ws";

    expect(getPublicApiBaseUrl()).toBe("https://api.saut.mx");
    expect(getServerApiBaseUrl()).toBe("http://api.internal:8080");
    expect(getAnalyticsWsUrl()).toBe("wss://api.saut.mx/ws");
  });
});
