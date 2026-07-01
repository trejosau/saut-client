import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/modules/auth/server/cookies";

const API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

export type DashboardKpiResponse = {
  from: string;
  to: string;
  sales: {
    paid_orders: number;
    sales_pings: number;
    items_sold: number;
    revenue_mxn: number;
  };
  lead_times_minutes: {
    paid_to_designed_avg?: number | null;
    designed_to_shipped_avg?: number | null;
    paid_to_delivered_avg?: number | null;
  };
  incidents: {
    created_cases: number;
    open_cases: number;
    by_reason: Array<{ reason: string; count: number }>;
  };
  merma: {
    events: number;
    units: number;
  };
  customizer: {
    started: number;
    added_to_cart: number;
    abandoned: number;
    abandonment_rate_pct: number;
    paid_items: number;
  };
  top_designs: Array<{
    publication_id?: string | null;
    publication_slug?: string | null;
    items_sold: number;
    revenue_mxn: number;
  }>;
  shipping_performance: Array<{
    provider: string;
    delivered_orders: number;
    failed_orders: number;
    incidents: number;
    avg_delivery_minutes?: number | null;
  }>;
  margins: {
    gross_revenue_mxn: number;
    estimated_cost_mxn?: number | null;
    gross_margin_mxn?: number | null;
    gross_margin_pct?: number | null;
    coverage_orders: number;
  };
};

type AdminRequestInit = RequestInit & {
  path: string;
};

async function adminRequest<T>(init: AdminRequestInit): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    throw new Error("No autenticado para dashboard admin.");
  }

  const response = await fetch(`${API_BASE_URL}${init.path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Admin API error (${response.status})${body ? `: ${body}` : ""}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text().catch(() => "");
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function getDashboardKpis(range?: { from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  const query = params.toString();

  return adminRequest<DashboardKpiResponse>({
    path: `/admin/analytics/kpis${query ? `?${query}` : ""}`,
    method: "GET",
  });
}