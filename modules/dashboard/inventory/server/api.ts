import { adminRequest } from "@/modules/dashboard/shared/server/admin-api";

export type InventoryItem = {
  id: string;
  garment_type: string;
  garment_model: string;
  color: string;
  size: string;
  grammage_g: number;
  fit: string;
  quantity: number;
  supplier_cost_mxn: string;
  created_at: string;
  updated_at: string;
};

export type InventoryMovement = {
  id: string;
  inventory_item_id: string;
  movement_type: string;
  quantity: number;
  reason?: string | null;
  actor?: string | null;
  source_ref?: string | null;
  created_at: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export async function listInventoryItems(params?: {
  garment_type?: string;
  in_stock_only?: boolean;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params?.garment_type) search.set("garment_type", params.garment_type);
  if (params?.in_stock_only) search.set("in_stock_only", "true");
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const query = search.toString();

  return adminRequest<PaginatedResponse<InventoryItem>>({
    path: `/admin/inventory/items${query ? `?${query}` : ""}`,
    method: "GET",
  });
}

export async function listInventoryMovements(params?: {
  movement_type?: string;
  inventory_item_id?: string;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params?.movement_type) search.set("movement_type", params.movement_type);
  if (params?.inventory_item_id) {
    search.set("inventory_item_id", params.inventory_item_id);
  }
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const query = search.toString();

  return adminRequest<PaginatedResponse<InventoryMovement>>({
    path: `/admin/inventory/movements${query ? `?${query}` : ""}`,
    method: "GET",
  });
}

export async function createInventoryEntry(input: {
  garment_type: string;
  garment_model?: string;
  color: string;
  size: string;
  grammage_g: number;
  fit?: string;
  quantity: number;
  supplier_cost_mxn?: string;
  supplier_name?: string;
  source_ref?: string;
  reason?: string;
}) {
  return adminRequest<unknown>({
    path: "/admin/inventory/entries",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createInventoryEntries(input: {
  items: Array<{
    garment_type: string;
    garment_model?: string;
    color: string;
    size: string;
    grammage_g: number;
    fit?: string;
    quantity: number;
    supplier_cost_mxn?: string;
    supplier_name?: string;
    source_ref?: string;
    reason?: string;
  }>;
}) {
  return adminRequest<unknown>({
    path: "/admin/inventory/entries/batch",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adjustInventoryQuantity(input: {
  inventory_item_id: string;
  new_quantity: number;
  source_ref?: string;
  reason?: string;
}) {
  return adminRequest<unknown>({
    path: "/admin/inventory/adjustments",
    method: "POST",
    body: JSON.stringify(input),
  });
}
