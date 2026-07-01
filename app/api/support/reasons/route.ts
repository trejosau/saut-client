import { NextRequest } from "next/server";

import { forwardSupportRequest } from "@/app/api/support/shared";

export async function GET(request: NextRequest) {
  return forwardSupportRequest(request, "/support/chat/reasons", {
    method: "GET",
  });
}
