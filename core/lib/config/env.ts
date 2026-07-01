const DEFAULT_API_BASE_URL = "http://localhost:8080";
const DEFAULT_ANALYTICS_WS_URL = "ws://localhost:8080/ws/map";

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function getPublicApiBaseUrl(): string {
  return (
    readEnv("NEXT_PUBLIC_API_BASE_URL") ??
    readEnv("API_BASE_URL") ??
    DEFAULT_API_BASE_URL
  );
}

export function getServerApiBaseUrl(): string {
  return readEnv("INTERNAL_API_BASE_URL") ?? getPublicApiBaseUrl();
}

export function getAnalyticsWsUrl(): string {
  return readEnv("NEXT_PUBLIC_ANALYTICS_WS_URL") ?? DEFAULT_ANALYTICS_WS_URL;
}
