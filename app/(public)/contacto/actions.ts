"use server";

import { revalidatePath } from "next/cache";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function sendContactMessageAction(formData: FormData) {
  const email = asString(formData.get("email"));
  const message = asString(formData.get("message"));

  if (!email || !message) {
    throw new Error("email y message son obligatorios.");
  }

  revalidatePath("/contacto");
}

