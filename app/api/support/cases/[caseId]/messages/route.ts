import { NextRequest } from "next/server";

import { forwardSupportRequest } from "@/app/api/support/shared";

type Params = Promise<{ caseId: string }>;

export async function POST(
  request: NextRequest,
  context: { params: Params }
) {
  const { caseId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const search = request.nextUrl.search;
  return forwardSupportRequest(
    request,
    `/support/cases/${encodeURIComponent(caseId)}/messages${search}`,
    {
      method: "POST",
      body,
    }
  );
}
