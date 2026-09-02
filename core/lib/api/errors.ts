export type ApiFieldErrors = Record<string, string[]>;

export type ApiErrorInit = {
  status?: number;
  code?: string;
  details?: unknown;
  fieldErrors?: ApiFieldErrors;
  requestId?: string;
  cause?: unknown;
};

/** Stable error contract shared by server actions, route handlers and clients. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly fieldErrors: ApiFieldErrors;
  readonly requestId?: string;
  readonly retryable: boolean;

  constructor(message: string, init: ApiErrorInit = {}) {
    super(message, { cause: init.cause });
    this.name = "ApiError";
    this.status = init.status ?? 0;
    this.code = init.code ?? codeForStatus(this.status);
    this.details = init.details;
    this.fieldErrors = normalizeFieldErrors(init.fieldErrors);
    this.requestId = init.requestId;
    this.retryable = this.status === 408 || this.status === 425 || this.status === 429 || this.status >= 500;
  }
}

function codeForStatus(status: number) {
  switch (status) {
    case 400: return "BAD_REQUEST";
    case 401: return "UNAUTHENTICATED";
    case 403: return "FORBIDDEN";
    case 404: return "NOT_FOUND";
    case 409: return "CONFLICT";
    case 422: return "VALIDATION_ERROR";
    case 429: return "RATE_LIMITED";
    case 408: return "TIMEOUT";
    case 413: return "PAYLOAD_TOO_LARGE";
    case 503: return "SERVICE_UNAVAILABLE";
    default: return status >= 500 ? "INTERNAL_ERROR" : "UNKNOWN_ERROR";
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeFieldErrors(value: unknown): ApiFieldErrors {
  const record = asRecord(value);
  const output: ApiFieldErrors = {};
  for (const [field, raw] of Object.entries(record)) {
    const values = Array.isArray(raw) ? raw : [raw];
    const messages = values.map((item) => typeof item === "string" ? item : asRecord(item).message).filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    if (messages.length) output[field] = [...new Set(messages)];
  }
  return output;
}

export function normalizeApiError(error: unknown, fallback = "No se pudo completar la operación."): ApiError {
  if (error instanceof ApiError) return error;
  if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") return new ApiError("La solicitud fue cancelada.", { code: "ABORTED", cause: error });
  if (error instanceof TypeError) return new ApiError("No se pudo conectar con el servidor.", { code: "NETWORK_ERROR", cause: error });
  if (error instanceof Error && error.message.trim()) return new ApiError(error.message.trim(), { cause: error });
  if (typeof error === "string" && error.trim()) return new ApiError(error.trim());
  return new ApiError(fallback, { cause: error });
}

export function messageForStatus(status: number): string {
  switch (status) {
    case 401: return "Tu sesión expiró. Inicia sesión nuevamente.";
    case 403: return "No tienes permisos para realizar esta acción.";
    case 404: return "No encontramos el recurso solicitado.";
    case 409: return "La operación entra en conflicto con el estado actual.";
    case 422: return "Revisa los campos marcados.";
    case 429: return "Demasiadas solicitudes. Intenta de nuevo en unos segundos.";
    case 408: return "La solicitud tardó demasiado. Intenta de nuevo.";
    case 413: return "El archivo o solicitud supera el tamaño permitido.";
    case 503: return "El servicio no está disponible temporalmente.";
    default: return status >= 500 ? "El servidor no pudo completar la operación." : "No se pudo completar la solicitud.";
  }
}

export function errorMessage(error: unknown, fallback?: string): string {
  const normalized = normalizeApiError(error, fallback);
  if (normalized.message && normalized.message !== "Request failed (" + normalized.status + ")" && normalized.message !== fallback) return normalized.message;
  return normalized.status ? messageForStatus(normalized.status) : (fallback ?? normalized.message);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
