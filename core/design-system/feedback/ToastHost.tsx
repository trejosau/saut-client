"use client";

import * as React from "react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info" | "warning";
export type ToastInput = { title?: string; message: string; tone?: ToastTone; durationMs?: number; id?: string };
type ToastItem = ToastInput & { id: string; tone: ToastTone; durationMs: number };

export type ToastContextValue = {
  push: (input: ToastInput) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const DEFAULT_DURATION_MS = 4200;
const DEFAULT_ERROR_DURATION_MS = 6200;
const TOAST_EVENT_NAME = "saut:toast";
const ToastContext = React.createContext<ToastContextValue | null>(null);
let mountedHosts = 0;
const pendingToasts: ToastInput[] = [];

function nextToastId() { return Date.now().toString(36) + "-" + Math.random().toString(16).slice(2, 10); }

export function emitToast(input: ToastInput): string {
  const payload = { ...input, id: input.id ?? nextToastId() };
  if (typeof window === "undefined") return payload.id;
  // Server actions and module-level helpers can fire before the React host has
  // mounted. Keep those notifications until the first host is ready.
  if (mountedHosts === 0) {
    pendingToasts.push(payload);
    if (pendingToasts.length > 20) pendingToasts.shift();
  } else {
    window.dispatchEvent(new CustomEvent<ToastInput>(TOAST_EVENT_NAME, { detail: payload }));
  }
  return payload.id;
}

/** Imperative notification API for server-action/client utility boundaries. */
export const notify = {
  push(input: ToastInput) { return emitToast(input); },
  success(message: string, title = "Éxito", options?: Omit<ToastInput, "message" | "tone" | "title">) { return emitToast({ ...options, tone: "success", title, message }); },
  error(message: string, title = "Error", options?: Omit<ToastInput, "message" | "tone" | "title">) { return emitToast({ ...options, tone: "error", title, message }); },
  info(message: string, title = "Info", options?: Omit<ToastInput, "message" | "tone" | "title">) { return emitToast({ ...options, tone: "info", title, message }); },
  warning(message: string, title = "Atención", options?: Omit<ToastInput, "message" | "tone" | "title">) { return emitToast({ ...options, tone: "warning", title, message }); },
};

function normalize(input: ToastInput): ToastItem {
  const tone = input.tone ?? "info";
  return {
    ...input,
    id: input.id ?? nextToastId(),
    tone,
    durationMs: typeof input.durationMs === "number" && input.durationMs > 0 ? input.durationMs : tone === "error" ? DEFAULT_ERROR_DURATION_MS : DEFAULT_DURATION_MS,
  };
}

function asErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "Ocurrió un error inesperado.";
}

function ToastView({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  React.useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.durationMs, toast.id]);
  const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? CircleAlert : toast.tone === "warning" ? TriangleAlert : Info;
  return (
    <article className={"saut-toast saut-toast--" + toast.tone} role={toast.tone === "error" ? "alert" : "status"}>
      <Icon className="saut-toast__icon" size={18} aria-hidden="true" />
      <div className="saut-toast__body">{toast.title ? <p className="saut-toast__title">{toast.title}</p> : null}<p className="saut-toast__message">{toast.message}</p></div>
      <button type="button" className="saut-toast__close" onClick={() => onDismiss(toast.id)} aria-label="Cerrar notificación"><X size={15} /></button>
      <span className="saut-toast__progress" style={{ animationDuration: toast.durationMs + "ms" }} />
    </article>
  );
}

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const recentRef = React.useRef(new Map<string, number>());
  const dismiss = React.useCallback((id: string) => setToasts((current) => current.filter((item) => item.id !== id)), []);
  const push = React.useCallback((input: ToastInput) => {
    const normalized = normalize(input);
    const key = normalized.tone + ":" + normalized.message;
    const now = Date.now();
    const previous = recentRef.current.get(key);
    if (previous && now - previous < 1200) return normalized.id;
    recentRef.current.set(key, now);
    setToasts((current) => [...current, normalized].slice(-5));
    return normalized.id;
  }, []);
  const success = React.useCallback((message: string, title = "Éxito") => push({ tone: "success", title, message }), [push]);
  const error = React.useCallback((message: string, title = "Error") => push({ tone: "error", title, message }), [push]);
  const info = React.useCallback((message: string, title = "Info") => push({ tone: "info", title, message }), [push]);
  const warning = React.useCallback((message: string, title = "Atención") => push({ tone: "warning", title, message }), [push]);
  const clear = React.useCallback(() => setToasts([]), []);

  React.useEffect(() => {
    mountedHosts += 1;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastInput>).detail;
      if (detail?.message?.trim()) push(detail);
    };
    const onWindowError = (event: ErrorEvent) => { if (event.message?.trim()) push({ tone: "error", title: "Error cliente", message: event.message }); };
    const onRejection = (event: PromiseRejectionEvent) => push({ tone: "error", title: "Error no controlado", message: asErrorMessage(event.reason) });
    window.addEventListener(TOAST_EVENT_NAME, onToast);
    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onRejection);
    // Flush events emitted before this provider mounted without losing their
    // original ids (which keeps duplicate suppression deterministic).
    const queued = pendingToasts.splice(0, pendingToasts.length);
    queued.forEach((toast) => push(toast));
    return () => { mountedHosts = Math.max(0, mountedHosts - 1); window.removeEventListener(TOAST_EVENT_NAME, onToast); window.removeEventListener("error", onWindowError); window.removeEventListener("unhandledrejection", onRejection); };
  }, [push]);

  const contextValue = React.useMemo(() => ({ push, success, error, info, warning, dismiss, clear }), [clear, dismiss, error, info, push, success, warning]);
  return <ToastContext.Provider value={contextValue}>{children}<div className="saut-toast-stack" aria-live="polite" aria-atomic="false">{toasts.map((toast) => <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />)}</div></ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider.");
  return context;
}
