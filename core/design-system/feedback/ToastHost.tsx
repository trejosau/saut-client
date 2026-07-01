"use client";

import * as React from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastInput = {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
  tone: ToastTone;
  durationMs: number;
};

type ToastContextValue = {
  push: (input: ToastInput) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
};

const DEFAULT_DURATION_MS = 4200;
const DEFAULT_ERROR_DURATION_MS = 6200;

const ToastContext = React.createContext<ToastContextValue | null>(null);

const TOAST_EVENT_NAME = "saut:toast";

type ToastWindowEvent = CustomEvent<ToastInput>;

function nextToastId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function emitToast(input: ToastInput) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastInput>(TOAST_EVENT_NAME, { detail: input }));
}

function normalizeToastInput(input: ToastInput): ToastItem {
  const tone = input.tone ?? "info";
  const durationMs =
    typeof input.durationMs === "number" && input.durationMs > 0
      ? input.durationMs
      : tone === "error"
        ? DEFAULT_ERROR_DURATION_MS
        : DEFAULT_DURATION_MS;

  return {
    id: nextToastId(),
    title: input.title,
    message: input.message,
    tone,
    durationMs,
  };
}

function asErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return "Ocurrió un error inesperado.";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const lastUnhandledRef = React.useRef<{ message: string; at: number } | null>(null);

  const dismiss = React.useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const push = React.useCallback((input: ToastInput) => {
    const normalized = normalizeToastInput(input);
    setToasts((previous) => [...previous, normalized].slice(-5));
  }, []);

  const success = React.useCallback(
    (message: string, title = "Éxito") => push({ tone: "success", title, message }),
    [push]
  );

  const error = React.useCallback(
    (message: string, title = "Error") => push({ tone: "error", title, message }),
    [push]
  );

  const info = React.useCallback(
    (message: string, title = "Info") => push({ tone: "info", title, message }),
    [push]
  );

  const warning = React.useCallback(
    (message: string, title = "Atención") => push({ tone: "warning", title, message }),
    [push]
  );

  React.useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismiss(toast.id), toast.durationMs)
    );
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [dismiss, toasts]);

  React.useEffect(() => {
    const onToastEvent = (event: Event) => {
      const custom = event as ToastWindowEvent;
      if (!custom.detail?.message) return;
      push(custom.detail);
    };

    const shouldSkipUnhandled = (message: string) => {
      const now = Date.now();
      const previous = lastUnhandledRef.current;
      if (previous && previous.message === message && now - previous.at < 1200) {
        return true;
      }
      lastUnhandledRef.current = { message, at: now };
      return false;
    };

    const onWindowError = (event: ErrorEvent) => {
      const message = event.message?.trim();
      if (!message || shouldSkipUnhandled(message)) return;
      push({
        tone: "error",
        title: "Error cliente",
        message,
        durationMs: DEFAULT_ERROR_DURATION_MS,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = asErrorMessage(event.reason);
      if (shouldSkipUnhandled(message)) return;
      push({
        tone: "error",
        title: "Error no controlado",
        message,
        durationMs: DEFAULT_ERROR_DURATION_MS,
      });
    };

    window.addEventListener(TOAST_EVENT_NAME, onToastEvent);
    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, onToastEvent);
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [push]);

  const contextValue = React.useMemo<ToastContextValue>(
    () => ({
      push,
      success,
      error,
      info,
      warning,
      dismiss,
    }),
    [dismiss, error, info, push, success, warning]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="saut-toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <article key={toast.id} className={`saut-toast saut-toast--${toast.tone}`} role="status">
            <div className="saut-toast__body">
              {toast.title ? <p className="saut-toast__title">{toast.title}</p> : null}
              <p className="saut-toast__message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="saut-toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Cerrar notificación"
            >
              x
            </button>
            <span
              className="saut-toast__progress"
              style={{ animationDuration: `${toast.durationMs}ms` }}
            />
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider.");
  }
  return context;
}
