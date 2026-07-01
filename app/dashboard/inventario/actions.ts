"use server";

import { revalidatePath } from "next/cache";

import {
  adjustInventoryQuantity,
  createInventoryEntries,
} from "@/modules/dashboard/inventory/server/api";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
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

export async function createInventoryEntryAction(formData: FormData) {
  const garmentTypes = formData.getAll("garment_type");
  const garmentModels = formData.getAll("garment_model");
  const colors = formData.getAll("color");
  const sizes = formData.getAll("size");
  const grammages = formData.getAll("grammage_g");
  const fits = formData.getAll("fit");
  const quantities = formData.getAll("quantity");
  const reason = asOptional(formData.get("reason"));

  if (garmentTypes.length === 0) {
    throw new Error("Debes seleccionar al menos una prenda.");
  }

  const fieldLengths = [
    garmentModels.length,
    colors.length,
    sizes.length,
    grammages.length,
    fits.length,
    quantities.length,
  ];

  if (fieldLengths.some((length) => length !== garmentTypes.length)) {
    throw new Error("La carga manual esta incompleta.");
  }

  await createInventoryEntries({
    items: garmentTypes.map((_, index) => ({
      garment_type: asString(garmentTypes[index]).toLowerCase(),
      garment_model: asOptional(garmentModels[index]),
      color: asString(colors[index]),
      size: asString(sizes[index]),
      grammage_g: asInt(grammages[index], "grammage_g"),
      fit: asOptional(fits[index]),
      quantity: asInt(quantities[index], "quantity"),
      reason,
    })),
  });

  revalidatePath("/dashboard/inventario");
}

export async function adjustInventoryQuantityAction(formData: FormData) {
  const inventoryItemId = asString(formData.get("inventory_item_id"));
  if (!inventoryItemId) {
    throw new Error("inventory_item_id es requerido.");
  }

  await adjustInventoryQuantity({
    inventory_item_id: inventoryItemId,
    new_quantity: asInt(formData.get("new_quantity"), "new_quantity"),
    reason: asOptional(formData.get("reason")),
  });

  revalidatePath("/dashboard/inventario");
}
