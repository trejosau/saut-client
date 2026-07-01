"use server";

import { revalidatePath } from "next/cache";

import {
  registerWorkOrderMerma,
  updateOrderStatus,
  updateWorkOrderChecklist,
} from "@/modules/dashboard/orders/server/api";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function checkbox(formData: FormData, key: string): boolean | undefined {
  if (!formData.has(key)) return undefined;
  const raw = asString(formData.get(key)).toLowerCase();
  if (!raw) return undefined;
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

function asOptional(value: FormDataEntryValue | null): string | undefined {
  const parsed = asString(value);
  return parsed ? parsed : undefined;
}

function asInt(value: FormDataEntryValue | null, field: string): number {
  const parsed = Number(asString(value));
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`${field} invalido.`);
  }
  return parsed;
}

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = asString(formData.get("order_id"));
  const status = asString(formData.get("status"));
  if (!orderId || !status) {
    throw new Error("order_id y status son obligatorios.");
  }

  await updateOrderStatus(orderId, {
    status,
    reason: asOptional(formData.get("reason")),
  });

  revalidatePath("/dashboard/pedidos");
}

export async function updateWorkOrderChecklistAction(formData: FormData) {
  const workOrderId = asString(formData.get("work_order_id"));
  if (!workOrderId) {
    throw new Error("El flujo del pedido es obligatorio.");
  }

  await updateWorkOrderChecklist(workOrderId, {
    dtf_sent_to_print: checkbox(formData, "dtf_sent_to_print"),
    dtf_printed: checkbox(formData, "dtf_printed"),
    dtf_applied: checkbox(formData, "dtf_applied"),
    packed: checkbox(formData, "packed"),
    shipped: checkbox(formData, "shipped"),
    delivered: checkbox(formData, "delivered"),
    reason: asOptional(formData.get("reason")),
  });

  revalidatePath("/dashboard/pedidos");
}

export async function registerMermaAction(formData: FormData) {
  const workOrderId = asString(formData.get("work_order_id"));
  const reasonCode = asString(formData.get("reason_code"));
  if (!workOrderId || !reasonCode) {
    throw new Error("El flujo del pedido y el reason_code son obligatorios.");
  }

  await registerWorkOrderMerma(workOrderId, {
    reason_code: reasonCode,
    notes: asOptional(formData.get("notes")),
    quantity: asInt(formData.get("quantity"), "quantity"),
  });

  revalidatePath("/dashboard/pedidos");
}
