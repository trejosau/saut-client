import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getServerApiBaseUrl } from "@/core/lib/config/env";
import { ACCESS_TOKEN_COOKIE } from "@/modules/auth/server/cookies";

type Params = Promise<{ segments: string[] }>;

function backendOrderPath(segments: string[], method: "GET" | "PATCH"): string | null {
  if (method === "GET" && segments.length === 1 && segments[0] === "lookup") return "/orders/lookup";
  if (method === "GET" && segments.length === 2 && segments[0] === "by-checkout") {
    return `/orders/by-checkout/${encodeURIComponent(segments[1]!)}`;
  }
  if (method === "GET" && segments.length === 1) return `/orders/${encodeURIComponent(segments[0]!)}`;
  if (method === "PATCH" && segments.length === 2 && segments[1] === "address") {
    return `/shipping/local/orders/${encodeURIComponent(segments[0]!)}/address`;
  }
  return null;
}

async function forwardOrderRequest(
  request: NextRequest,
  path: string,
  method: "GET" | "PATCH"
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const headers = new Headers({ Accept: "application/json" });
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const orderAccessToken = request.headers.get("x-order-access-token");

  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (orderAccessToken) headers.set("x-order-access-token", orderAccessToken);
  if (method === "PATCH") headers.set("Content-Type", "application/json");

  const url = new URL(path, getServerApiBaseUrl());
  url.search = request.nextUrl.search;
  const response = await fetch(url, {
    method,
    headers,
    body: method === "PATCH" ? await request.text() : undefined,
    cache: "no-store",
  });
  const body = await response.text();
  const result = new NextResponse(body, { status: response.status });
  const contentType = response.headers.get("content-type");
  const requestId = response.headers.get("x-request-id");
  if (contentType) result.headers.set("content-type", contentType);
  if (requestId) result.headers.set("x-request-id", requestId);
  return result;
}

export async function GET(request: NextRequest, context: { params: Params }) {
  const { segments } = await context.params;
  const path = backendOrderPath(segments, "GET");
  if (!path) return NextResponse.json({ error: "Ruta de pedido no encontrada." }, { status: 404 });
  return forwardOrderRequest(request, path, "GET");
}

export async function PATCH(request: NextRequest, context: { params: Params }) {
  const { segments } = await context.params;
  const path = backendOrderPath(segments, "PATCH");
  if (!path) return NextResponse.json({ error: "Ruta de pedido no encontrada." }, { status: 404 });
  return forwardOrderRequest(request, path, "PATCH");
}
