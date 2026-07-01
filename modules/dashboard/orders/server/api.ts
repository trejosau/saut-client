import { adminRequest } from "@/modules/dashboard/shared/server/admin-api";

export type OrderItem = {
  id: string;
  item_type: string;
  publication_id?: string | null;
  publication_slug?: string | null;
  design_variant_id?: string | null;
  garment_type: string;
  garment_model: string;
  color: string;
  size: string;
  grammage_g: number;
  fit: string;
  quantity: number;
  unit_price_mxn: number;
  snapshot: Record<string, unknown>;
};

export type Order = {
  id: string;
  checkout_session_id: string;
  payment_attempt_id: string;
  payment_reference: string;
  email: string;
  phone: string;
  shipping_method: string;
  shipping_cost_mxn: number;
  subtotal_mxn: number;
  total_mxn: number;
  currency: string;
  address: Record<string, unknown>;
  status: string;
  tracking_number?: string | null;
  tracking_carrier?: string | null;
  tracking_url?: string | null;
  shipping_label_url?: string | null;
  drop_id?: string | null;
  drop_number?: number | null;
  drop_total_limit?: number | null;
  drop_label?: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type WorkOrderChecklist = {
  dtf_sent_to_print: boolean;
  dtf_printed: boolean;
  dtf_applied: boolean;
  packed: boolean;
  shipped: boolean;
  delivered: boolean;
  dtf_sent_to_print_at?: string | null;
  dtf_printed_at?: string | null;
  dtf_applied_at?: string | null;
  packed_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
};

export type WorkOrder = {
  id: string;
  order_id: string;
  order_item_id: string;
  status: string;
  failures_count: number;
  last_failure_at?: string | null;
  checklist: WorkOrderChecklist;
  created_at: string;
  updated_at: string;
};

export type AdminOrderDetail = {
  order: Order;
  work_orders: WorkOrder[];
};

export type PaginatedOrders = {
  items: Order[];
  total: number;
  limit: number;
  offset: number;
};

export async function listAdminOrders(params?: {
  status?: string;
  shipping_method?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.shipping_method) {
    search.set("shipping_method", params.shipping_method);
  }
  if (params?.q) search.set("q", params.q);
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const query = search.toString();

  return adminRequest<PaginatedOrders>({
    path: `/admin/orders${query ? `?${query}` : ""}`,
    method: "GET",
  });
}

export async function getAdminOrder(orderId: string) {
  return adminRequest<AdminOrderDetail>({
    path: `/admin/orders/${orderId}`,
    method: "GET",
  });
}

export async function updateOrderStatus(orderId: string, input: {
  status: string;
  reason?: string;
}) {
  return adminRequest<{
    order_id: string;
    previous_status: string;
    status: string;
  }>({
    path: `/ops/orders/${orderId}/status`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateWorkOrderChecklist(workOrderId: string, input: {
  dtf_sent_to_print?: boolean;
  dtf_printed?: boolean;
  dtf_applied?: boolean;
  packed?: boolean;
  shipped?: boolean;
  delivered?: boolean;
  reason?: string;
}) {
  return adminRequest<{
    work_order: WorkOrder;
    order_status: string;
  }>({
    path: `/admin/work-orders/${workOrderId}/checklist`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function registerWorkOrderMerma(workOrderId: string, input: {
  reason_code: string;
  notes?: string;
  quantity: number;
}) {
  return adminRequest<{
    work_order: WorkOrder;
  }>({
    path: `/admin/work-orders/${workOrderId}/merma`,
    method: "POST",
    body: JSON.stringify(input),
  });
}
