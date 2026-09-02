"use client";

import { buildApiUrl } from "@/core/lib/api/endpoints";
import { requestJson } from "@/core/lib/api/fetcher";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const EMBEDDED_BROWSER_PATTERNS = [
  /Instagram/i,
  /FBAN|FBAV|FB_IAB/i,
  /TikTok/i,
  /MicroMessenger/i,
  /Line\//i,
  /; wv\)/i,
] as const;

type StartEmailLoginResponse = {
  status: string;
  expires_in_sec: number;
  resend_after_sec: number;
  delivery: string;
  code?: string;
};

type VerifyEmailLoginResponse = {
  account_id: string;
  session_id: string;
  actor_type: string;
  expires_in_sec: number;
  session_expires_in_sec?: number;
  is_new_account: boolean;
  primary_email?: string | null;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = buildApiUrl(path, undefined, API_BASE_URL);
  return requestJson<T>(url, {
    method: "POST",
    json: body,
  });
}

export async function startEmailLogin(email: string) {
  return postJson<StartEmailLoginResponse>("/auth/email/start", { email });
}

export async function verifyEmailLogin(email: string, code: string) {
  return requestJson<VerifyEmailLoginResponse>("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    json: { email, code },
  });
}

export function getGoogleLoginUnavailableReason(userAgent?: string) {
  if (typeof window === "undefined") return null;

  const ua = userAgent ?? window.navigator.userAgent;
  const blocked = EMBEDDED_BROWSER_PATTERNS.some((pattern) => pattern.test(ua));
  if (!blocked) return null;

  return "Google login suele fallar dentro del navegador integrado de la app. Abre SAUT en Chrome o Safari y vuelve a intentarlo.";
}

export function buildGoogleLoginUrl(returnTo?: string) {
  const origin = typeof window === "undefined" ? API_BASE_URL : window.location.origin;
  const url = new URL("/api/auth/google/start", origin);
  if (returnTo) {
    url.searchParams.set("return_to", returnTo);
  }

  return url;
}

export function startGoogleLogin(returnTo?: string) {
  if (typeof window === "undefined") return;

  const reason = getGoogleLoginUnavailableReason();
  if (reason) {
    throw new Error(reason);
  }

  window.location.href = buildGoogleLoginUrl(returnTo).toString();
}
