"use server";

import { revalidatePath } from "next/cache";

import {
  addAdminSupportMessage,
  registerSupportRefund,
  updateAdminSupportCaseStatus,
} from "@/modules/dashboard/support/server/api";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function asOptional(value: FormDataEntryValue | null): string | undefined {
  const parsed = asString(value);
  return parsed ? parsed : undefined;
}

function asInt(value: FormDataEntryValue | null): number | undefined {
  const parsed = asString(value);
  if (!parsed) return undefined;
  const valueNumber = Number(parsed);
  if (!Number.isFinite(valueNumber) || !Number.isInteger(valueNumber)) {
    throw new Error("amount_mxn invalido.");
  }
  return valueNumber;
}

function invalidate() {
  revalidatePath("/dashboard/soporte");
}

export async function updateSupportCaseStatusAction(formData: FormData) {
  const caseId = asString(formData.get("case_id"));
  const status = asString(formData.get("status"));
  if (!caseId || !status) {
    throw new Error("case_id y status son obligatorios.");
  }

  await updateAdminSupportCaseStatus(caseId, {
    status: status as "open" | "in_review" | "pending_customer" | "resolved" | "closed",
    note: asOptional(formData.get("note")),
    notify_customer: asString(formData.get("notify_customer")) === "true",
  });
  invalidate();
}

export async function addSupportMessageAction(formData: FormData) {
  const caseId = asString(formData.get("case_id"));
  const message = asString(formData.get("message"));
  if (!caseId || !message) {
    throw new Error("case_id y message son obligatorios.");
  }

  await addAdminSupportMessage(caseId, {
    message,
    is_internal: asString(formData.get("is_internal")) === "true",
  });
  invalidate();
}

export async function registerSupportRefundAction(formData: FormData) {
  const caseId = asString(formData.get("case_id"));
  const reasonCode = asString(formData.get("reason_code"));
  if (!caseId || !reasonCode) {
    throw new Error("case_id y reason_code son obligatorios.");
  }

  await registerSupportRefund(caseId, {
    mode: (asString(formData.get("mode")) || "manual") as "manual" | "auto",
    reason_code: reasonCode,
    notes: asOptional(formData.get("notes")),
    amount_mxn: asInt(formData.get("amount_mxn")),
  });
  invalidate();
}

