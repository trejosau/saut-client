import { ApiError, type ApiFieldErrors } from "./errors";

type ApiErrorPayload = {
  error?: unknown;
  code?: unknown;
  message?: unknown;
  details?: unknown;
  errors?: unknown;
  field_errors?: unknown;
  fieldErrors?: unknown;
};

export type ApiRequestOptions = RequestInit & {
  json?: unknown;
  timeoutMs?: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function messageFromPayload(payload: ApiErrorPayload | null, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message.trim();
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error.trim();
  return fallback;
}

function fieldErrorsFromPayload(payload: ApiErrorPayload | null): ApiFieldErrors {
  const raw = payload?.field_errors ?? payload?.fieldErrors ?? payload?.errors;
  const record = asRecord(raw);
  const output: ApiFieldErrors = {};
  for (const [field, value] of Object.entries(record)) {
    const values = Array.isArray(value) ? value : [value];
    const messages = values.map((item) => typeof item === "string" ? item : asRecord(item).message).filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    if (messages.length) output[field] = [...new Set(messages)];
  }
  return output;
}

async function readBody(response: Response): Promise<{ payload: ApiErrorPayload | null; text: string }> {
  const text = await response.text().catch(() => "");
  if (!text.trim()) return { payload: null, text: "" };
  try {
    const parsed = JSON.parse(text) as unknown;
    return { payload: asRecord(parsed) as ApiErrorPayload, text };
  } catch {
    return { payload: null, text: text.trim() };
  }
}

export async function requestJson<T>(input: string | URL, options: ApiRequestOptions = {}): Promise<T> {
  const { json, timeoutMs, headers, body, signal, ...init } = options;
  const controller = timeoutMs && typeof AbortController !== "undefined" ? new AbortController() : null;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const onCallerAbort = () => controller?.abort(signal?.reason);
  if (controller && signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", onCallerAbort, { once: true });
  }
  if (controller && timeoutMs) timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requestHeaders = new Headers(headers);
  if (json !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  } else if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      signal: controller?.signal ?? signal,
      body: json === undefined ? body : JSON.stringify(json),
      headers: requestHeaders,
      cache: init.cache ?? "no-store",
      credentials: init.credentials ?? "same-origin",
    });
  } catch (error) {
    if (controller?.signal.aborted) throw new ApiError("La solicitud tardó demasiado.", { status: 408, code: "TIMEOUT", cause: error });
    if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") throw new ApiError("La solicitud fue cancelada.", { code: "ABORTED", cause: error });
    throw new ApiError("No se pudo conectar con el servidor.", { code: "NETWORK_ERROR", cause: error });
  } finally {
    if (timeout) clearTimeout(timeout);
    signal?.removeEventListener("abort", onCallerAbort);
  }
  if (!response.ok) {
    const bodyResult = await readBody(response);
    const fallback = "Request failed (" + response.status + ")";
    throw new ApiError(messageFromPayload(bodyResult.payload, bodyResult.text || fallback), {
      status: response.status,
      code: typeof bodyResult.payload?.code === "string" ? bodyResult.payload.code : undefined,
      details: bodyResult.payload?.details,
      fieldErrors: fieldErrorsFromPayload(bodyResult.payload),
      requestId: response.headers.get("x-request-id") ?? undefined,
    });
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text.trim()) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new ApiError("El servidor devolvió una respuesta inválida.", { code: "INVALID_RESPONSE", cause: error });
  }
}

export { ApiError };
