"use server";

import { revalidatePath } from "next/cache";

import {
  assignRole,
  removePermissionOverride,
  removeRole,
  updateAccountStatus,
  upsertPermissionOverride,
} from "@/modules/dashboard/security/server/api";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function asOptional(value: FormDataEntryValue | null): string | undefined {
  const parsed = asString(value);
  return parsed ? parsed : undefined;
}

function invalidate() {
  revalidatePath("/dashboard/permisos-auditoria");
}

export async function assignRoleAction(formData: FormData) {
  const accountId = asString(formData.get("account_id"));
  const roleCode = asString(formData.get("role_code"));
  if (!accountId || !roleCode) {
    throw new Error("account_id y role_code son obligatorios.");
  }
  await assignRole(accountId, roleCode);
  invalidate();
}

export async function removeRoleAction(formData: FormData) {
  const accountId = asString(formData.get("account_id"));
  const roleCode = asString(formData.get("role_code"));
  if (!accountId || !roleCode) {
    throw new Error("account_id y role_code son obligatorios.");
  }
  await removeRole(accountId, roleCode);
  invalidate();
}

export async function upsertPermissionOverrideAction(formData: FormData) {
  const accountId = asString(formData.get("account_id"));
  const screen = asString(formData.get("screen"));
  const action = asString(formData.get("action"));
  const effect = asString(formData.get("effect"));
  if (!accountId || !screen || !action || !effect) {
    throw new Error("account_id, screen, action y effect son obligatorios.");
  }
  await upsertPermissionOverride({
    account_id: accountId,
    screen,
    action,
    effect: effect === "deny" ? "deny" : "allow",
    reason: asOptional(formData.get("reason")),
  });
  invalidate();
}

export async function removePermissionOverrideAction(formData: FormData) {
  const accountId = asString(formData.get("account_id"));
  const screen = asString(formData.get("screen"));
  const action = asString(formData.get("action"));
  if (!accountId || !screen || !action) {
    throw new Error("account_id, screen y action son obligatorios.");
  }
  await removePermissionOverride({
    account_id: accountId,
    screen,
    action,
  });
  invalidate();
}

export async function updateAccountStatusAction(formData: FormData) {
  const accountId = asString(formData.get("account_id"));
  const status = asString(formData.get("status"));
  if (!accountId || !status) {
    throw new Error("account_id y status son obligatorios.");
  }

  await updateAccountStatus({
    account_id: accountId,
    status,
    reason: asOptional(formData.get("reason")),
  });
  invalidate();
}
