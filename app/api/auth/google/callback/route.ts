import { NextResponse } from "next/server";

import { getAuthApiBaseUrl } from "@/modules/auth/server/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const target = new URL("/api/auth/google/callback", getAuthApiBaseUrl());

  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const response = NextResponse.redirect(target, { status: 302 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
