"use server";

import { revalidatePath } from "next/cache";

import {
  createNationalShipment,
  markLocalDelivered,
  markLocalFailed,
  markLocalOutForDelivery,
  markLocalReady,
  refreshNationalTracking,
  updateLocalAddress,
} from "@/modules/dashboard/shipping/server/api";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function asOptional(value: FormDataEntryValue | null): string | undefined {
  const parsed = asString(value);
  return parsed ? parsed : undefined;
}

function invalidate() {
  revalidatePath("/dashboard/envios");
  revalidatePath("/dashboard/pedidos");
}

export async function createNationalShipmentAction(formData: FormData) {
  const orderId = asString(formData.get("order_id"));
  if (!orderId) throw new Error("order_id es requerido.");

  await createNationalShipment(orderId, {
    printing_format: asOptional(formData.get("printing_format")) as
      | "standard"
      | "thermal"
      | undefined,
    package_type: asOptional(formData.get("package_type")),
    consignment_note: asOptional(formData.get("consignment_note")),
    declared_value: asOptional(formData.get("declared_value"))
      ? Number(asOptional(formData.get("declared_value")))
      : undefined,
  });
  invalidate();
}

export async function refreshNationalTrackingAction(formData: FormData) {
  const orderId = asString(formData.get("order_id"));
  if (!orderId) throw new Error("order_id es requerido.");
  await refreshNationalTracking(orderId);
  invalidate();
}

export async function markLocalReadyAction(formData: FormData) {
  const orderId = asString(formData.get("order_id"));
  if (!orderId) throw new Error("order_id es requerido.");
  await markLocalReady(orderId, asOptional(formData.get("route_date")));
  invalidate();
}

export async function markLocalOutForDeliveryAction(formData: FormData) {
  const orderId = asString(formData.get("order_id"));
  if (!orderId) throw new Error("order_id es requerido.");
  await markLocalOutForDelivery(orderId);
  invalidate();
}

export async function markLocalDeliveredAction(formData: FormData) {
  const orderId = asString(formData.get("order_id"));
  if (!orderId) throw new Error("order_id es requerido.");
  await markLocalDelivered(orderId, {
    photo_url: asOptional(formData.get("photo_url")),
    notes: asOptional(formData.get("notes")),
  });
  invalidate();
}

export async function markLocalFailedAction(formData: FormData) {
  const orderId = asString(formData.get("order_id"));
  if (!orderId) throw new Error("order_id es requerido.");
  await markLocalFailed(orderId, {
    photo_url: asOptional(formData.get("photo_url")),
    notes: asOptional(formData.get("notes")),
  });
  invalidate();
}

export async function updateLocalAddressAction(formData: FormData) {
  const orderId = asString(formData.get("order_id"));
  if (!orderId) throw new Error("order_id es requerido.");

  await updateLocalAddress(orderId, {
    reason: asOptional(formData.get("reason")),
    address: {
      line1: asString(formData.get("line1")),
      line2: asOptional(formData.get("line2")),
      city: asString(formData.get("city")),
      state: asString(formData.get("state")),
      postal_code: asString(formData.get("postal_code")),
      country: asOptional(formData.get("country")) ?? "MX",
      reference: asOptional(formData.get("reference")),
    },
  });
  invalidate();
}

