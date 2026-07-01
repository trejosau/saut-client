import { adminRequest } from "@/modules/dashboard/shared/server/admin-api";

export type Shipment = {
  id: string;
  order_id: string;
  shipping_method: string;
  status: string;
  provider?: string | null;
  provider_shipment_id?: string | null;
  quotation_id?: string | null;
  rate_id?: string | null;
  tracking_number?: string | null;
  tracking_carrier?: string | null;
  tracking_url?: string | null;
  label_url?: string | null;
  local_route_date?: string | null;
  failed_attempts: number;
  created_at: string;
  updated_at: string;
};

export type ShipmentActionResponse = {
  shipment: Shipment;
  order_status: string;
};

export type ShipmentEvent = {
  id: string;
  event_type: string;
  payload?: Record<string, unknown> | null;
  created_at: string;
};

export type LocalAddressPayload = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  reference?: string;
};

export type LocalRouteStop = {
  order_id: string;
  shipment_id: string;
  status: string;
  email: string;
  phone: string;
  address: LocalAddressPayload;
  notes?: string | null;
};

export type LocalRouteTodayResponse = {
  date: string;
  total: number;
  stops: LocalRouteStop[];
  printable_text: string;
};

export type ShipmentOrderSummary = {
  id: string;
  email: string;
  phone: string;
  status: string;
  shipping_method: string;
  address: LocalAddressPayload;
  tracking_number?: string | null;
  tracking_carrier?: string | null;
  tracking_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminShipmentListItem = {
  shipment: Shipment;
  order: ShipmentOrderSummary;
  events: ShipmentEvent[];
};

export type PaginatedAdminShipments = {
  items: AdminShipmentListItem[];
  total: number;
  limit: number;
  offset: number;
};

export async function createNationalShipment(orderId: string, input?: {
  printing_format?: "standard" | "thermal";
  package_type?: string;
  consignment_note?: string;
  declared_value?: number;
}) {
  return adminRequest<ShipmentActionResponse>({
    path: `/admin/shipping/national/orders/${orderId}/shipment`,
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}

export async function refreshNationalTracking(orderId: string) {
  return adminRequest<{
    shipment: Shipment;
    delivered: boolean;
    events_count: number;
    order_status: string;
  }>({
    path: `/admin/shipping/national/orders/${orderId}/tracking/refresh`,
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function markLocalReady(orderId: string, routeDate?: string) {
  return adminRequest<ShipmentActionResponse>({
    path: `/admin/shipping/local/orders/${orderId}/ready`,
    method: "POST",
    body: JSON.stringify(routeDate ? { route_date: routeDate } : {}),
  });
}

export async function markLocalOutForDelivery(orderId: string) {
  return adminRequest<ShipmentActionResponse>({
    path: `/admin/shipping/local/orders/${orderId}/out-for-delivery`,
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function markLocalDelivered(orderId: string, input?: {
  photo_url?: string;
  notes?: string;
}) {
  return adminRequest<ShipmentActionResponse>({
    path: `/admin/shipping/local/orders/${orderId}/delivered`,
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}

export async function markLocalFailed(orderId: string, input?: {
  photo_url?: string;
  notes?: string;
}) {
  return adminRequest<ShipmentActionResponse>({
    path: `/admin/shipping/local/orders/${orderId}/failed`,
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}

export async function updateLocalAddress(orderId: string, input: {
  address: LocalAddressPayload;
  reason?: string;
}) {
  return adminRequest<{
    order_id: string;
    address: LocalAddressPayload;
    shipment?: Shipment | null;
  }>({
    path: `/admin/shipping/local/orders/${orderId}/address`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getLocalRouteToday(date?: string) {
  const search = new URLSearchParams();
  if (date) search.set("date", date);
  const query = search.toString();

  return adminRequest<LocalRouteTodayResponse>({
    path: `/admin/shipping/local/routes/today${query ? `?${query}` : ""}`,
    method: "GET",
  });
}

export async function listAdminShipments(params?: {
  shipping_method?: string;
  status?: string;
  order_id?: string;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params?.shipping_method) {
    search.set("shipping_method", params.shipping_method);
  }
  if (params?.status) search.set("status", params.status);
  if (params?.order_id) search.set("order_id", params.order_id);
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const query = search.toString();

  return adminRequest<PaginatedAdminShipments>({
    path: `/admin/shipping/shipments${query ? `?${query}` : ""}`,
    method: "GET",
  });
}
