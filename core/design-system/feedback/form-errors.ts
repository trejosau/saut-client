export type FieldErrors = Record<string, string[]>;

export type FormErrorBag = {
  summary: string[];
  fields: FieldErrors;
  rawMessage: string;
};

function extractAdminApiMessage(raw: string): string {
  const match = raw.match(/^Admin API error \(\d+\):\s*(.+)$/i);
  if (!match) return raw;
  const payload = (match[1] ?? "").trim();
  if (!payload) return raw;

  if (payload.startsWith("{") || payload.startsWith("[")) {
    try {
      const parsed = JSON.parse(payload) as { message?: unknown };
      if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
        return parsed.message.trim();
      }
    } catch {
      // Keep original payload when it is not valid JSON.
    }
  }

  return payload;
}

function normalizeKnownMessages(raw: string): string {
  const message = extractAdminApiMessage(raw).replace(/^Bad request:\s*/i, "").trim();
  const lower = message.toLowerCase();

  if (lower.includes("debe enviar al menos un campo de checklist")) {
    return "Debes poner al menos un campo del checklist.";
  }

  return message || raw;
}

function asErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return normalizeKnownMessages(error.message.trim());
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return normalizeKnownMessages(error.trim());
  }
  return fallback;
}

function normalizeFieldToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/\s+/g, "_");
}

function extractFieldTokens(raw: string): string[] {
  return raw
    .split(/,|\sy\s/gi)
    .map((part) => normalizeFieldToken(part))
    .filter((part) => /^[a-z0-9_]+$/.test(part))
    .filter((part) => part.length > 0);
}

function pushFieldError(fields: FieldErrors, field: string, message: string) {
  if (!fields[field]) {
    fields[field] = [];
  }
  if (!fields[field].includes(message)) {
    fields[field].push(message);
  }
}

function parseFieldErrors(message: string): FieldErrors {
  const fields: FieldErrors = {};

  const requiredGroupMatch = message.match(/^(.+?)\s+son obligatorios?\.?$/i);
  if (requiredGroupMatch) {
    const requiredFields = extractFieldTokens(requiredGroupMatch[1] ?? "");
    for (const field of requiredFields) {
      pushFieldError(fields, field, "Este campo es obligatorio.");
    }
  }

  const requiredSingleRegex = /([a-z0-9_]+)\s+es\s+obligatorio/gi;
  for (const match of message.matchAll(requiredSingleRegex)) {
    const field = normalizeFieldToken(match[1] ?? "");
    if (!field) continue;
    pushFieldError(fields, field, "Este campo es obligatorio.");
  }

  const invalidRegex = /([a-z0-9_]+)\s+invalido/gi;
  for (const match of message.matchAll(invalidRegex)) {
    const field = normalizeFieldToken(match[1] ?? "");
    if (!field) continue;
    pushFieldError(fields, field, "El valor no es valido.");
  }

  const integerRegex = /([a-z0-9_]+)\s+debe\s+ser\s+entero/gi;
  for (const match of message.matchAll(integerRegex)) {
    const field = normalizeFieldToken(match[1] ?? "");
    if (!field) continue;
    pushFieldError(fields, field, "Debe ser un numero entero.");
  }

  return fields;
}

export function toFormErrorBag(error: unknown, fallback = "No se pudo completar la accion."): FormErrorBag {
  const message = isApiError(error)
    ? errorMessage(error, fallback)
    : asErrorMessage(error, fallback);
  const fields = parseFieldErrors(message);
  if (isApiError(error)) {
    for (const [field, messages] of Object.entries(error.fieldErrors)) {
      for (const fieldMessage of messages) {
        pushFieldError(fields, field, fieldMessage);
      }
    }
  }
  const summary = message
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    summary: summary.length > 0 ? summary : [fallback],
    fields,
    rawMessage: message,
  };
}

export function fieldError(bag: FormErrorBag | null | undefined, field: string): string | null {
  if (!bag) return null;
  const normalized = normalizeFieldToken(field);
  const errors = bag.fields[normalized];
  if (!errors || errors.length === 0) return null;
  return errors[0] ?? null;
}
import { errorMessage, isApiError } from "@/core/lib/api/errors";
