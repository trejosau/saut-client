import { NextRequest } from "next/server";

import { forwardSupportRequest } from "@/app/api/support/shared";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search;
  return forwardSupportRequest(request, `/support/cases${search}`, {
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return forwardSupportRequest(request, "/support/cases", {
    method: "POST",
    body,
  });
}
