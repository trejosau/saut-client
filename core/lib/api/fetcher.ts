type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export type ApiRequestOptions = RequestInit & {
  json?: unknown;
};

function parseApiErrorMessage(
  payload: ApiErrorPayload | null,
  fallback: string
): string {
  if (!payload) return fallback;
  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message;
  }
  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error;
  }
  return fallback;
}

async function readErrorMessage(response: Response): Promise<string> {
  let fallback = `Request failed (${response.status})`;

  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return parseApiErrorMessage(payload, fallback);
  } catch {
    try {
      const text = await response.text();
      if (text.trim().length > 0) {
        fallback = text.trim();
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export async function requestJson<T>(
  input: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { json, headers, ...init } = options;
  const response = await fetch(input, {
    ...init,
    body: json === undefined ? init.body : JSON.stringify(json),
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    cache: init.cache ?? "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
