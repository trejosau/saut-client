"use client";

export type LinkedOrderRecord = {
  order_id: string;
  order_code: string;
  order_access_token?: string;
  email: string;
  account_id: string | null;
  status?: string;
  shipping_method?: string;
  tracking_number?: string | null;
  total_mxn?: number;
  created_at: string;
  updated_at: string;
};

const STORAGE_KEY = "saut.orders.linked.v1";

function readRecords(): LinkedOrderRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((value) => value && typeof value === "object")
      .map((value) => {
        const row = value as Partial<LinkedOrderRecord>;
        return {
          order_id: String(row.order_id ?? ""),
          order_code: String(row.order_code ?? ""),
          order_access_token:
            typeof row.order_access_token === "string" && row.order_access_token.length >= 32
              ? row.order_access_token
              : undefined,
          email: String(row.email ?? ""),
          account_id:
            typeof row.account_id === "string" && row.account_id.trim().length > 0
              ? row.account_id
              : null,
          status: row.status ? String(row.status) : undefined,
          shipping_method: row.shipping_method ? String(row.shipping_method) : undefined,
          tracking_number:
            typeof row.tracking_number === "string" ? row.tracking_number : null,
          total_mxn:
            typeof row.total_mxn === "number" && Number.isFinite(row.total_mxn)
              ? row.total_mxn
              : undefined,
          created_at: String(row.created_at ?? new Date().toISOString()),
          updated_at: String(row.updated_at ?? new Date().toISOString()),
        };
      })
      .filter((row) => row.order_id.length > 0);
  } catch {
    return [];
  }
}

function writeRecords(records: LinkedOrderRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function normalizeOrderCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-f0-9]/g, "").slice(0, 8);
}

export function buildOrderCode(orderId: string): string {
  return normalizeOrderCode(orderId.replaceAll("-", ""));
}

export function listLinkedOrders(accountId?: string | null): LinkedOrderRecord[] {
  const records = readRecords();
  if (!accountId) {
    return records
      .filter((record) => record.account_id === null)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  return records
    .filter((record) => record.account_id === accountId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function upsertLinkedOrder(
  input: Omit<LinkedOrderRecord, "created_at" | "updated_at">
) {
  const records = readRecords();
  const now = new Date().toISOString();
  const normalizedCode = normalizeOrderCode(input.order_code || buildOrderCode(input.order_id));
  const normalizedEmail = input.email.trim().toLowerCase();

  const next: LinkedOrderRecord = {
    ...input,
    order_code: normalizedCode,
    email: normalizedEmail,
    created_at: now,
    updated_at: now,
  };

  const existingIndex = records.findIndex(
    (row) =>
      row.order_id === input.order_id &&
      (row.account_id ?? null) === (input.account_id ?? null)
  );

  if (existingIndex >= 0) {
    next.created_at = records[existingIndex].created_at;
    records[existingIndex] = { ...records[existingIndex], ...next, updated_at: now };
  } else {
    records.push(next);
  }

  writeRecords(records);
}

export function migrateGuestLinkedOrdersToAccount(accountId: string) {
  const normalized = accountId.trim();
  if (!normalized) return;

  const records = readRecords();
  let changed = false;
  const now = new Date().toISOString();

  const mapped = records.map((record) => {
    if (record.account_id !== null) return record;
    changed = true;
    return {
      ...record,
      account_id: normalized,
      updated_at: now,
    };
  });

  if (changed) {
    const deduped: LinkedOrderRecord[] = [];
    for (const row of mapped) {
      const existing = deduped.findIndex(
        (item) =>
          item.order_id === row.order_id &&
          (item.account_id ?? null) === (row.account_id ?? null)
      );
      if (existing >= 0) {
        deduped[existing] = {
          ...deduped[existing],
          ...row,
          created_at: deduped[existing].created_at,
        };
      } else {
        deduped.push(row);
      }
    }
    writeRecords(deduped);
  }
}
