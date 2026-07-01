import { NextResponse } from "next/server";

import {
  getAuthApiBaseUrl,
  sanitizeReturnTo,
} from "@/modules/auth/server/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = sanitizeReturnTo(url.searchParams.get("return_to"), url.origin);
  const target = new URL("/api/auth/google/start", getAuthApiBaseUrl());
  target.searchParams.set("return_to", returnTo);

  const response = NextResponse.redirect(target, { status: 302 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
