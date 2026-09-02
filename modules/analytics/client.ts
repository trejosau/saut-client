import { buildApiUrl } from "@/core/lib/api/endpoints";
import { requestJson } from "@/core/lib/api/fetcher";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  "http://localhost:8080";

type CustomizerEventInput = {
  eventType: "customizer_started" | "customizer_added_to_cart";
  eventId?: string;
  sessionId: string;
  accountId?: string | null;
  designId?: string;
  garmentCount?: number;
  payload?: Record<string, unknown>;
};

export async function emitCustomizerEvent(input: CustomizerEventInput) {
  const body: Record<string, unknown> = {
    event_id: input.eventId,
    event_type: input.eventType,
    session_id: input.sessionId,
    design_id: input.designId,
    garment_count: input.garmentCount,
    payload: input.payload,
  };

  if (input.accountId) {
    body.account_id = input.accountId;
  }

  try {
    await requestJson<unknown>(buildApiUrl("/analytics/customizer/events", undefined, API_BASE_URL), {
      method: "POST",
      json: body,
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // best effort
  }
}
