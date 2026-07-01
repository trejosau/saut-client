"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useToast } from "@/core/design-system/feedback/ToastHost";

type Step = "email" | "code";

export type LoginModalProps = {
    open: boolean;
    onClose: () => void;

    // Hooks para integrar luego (ahorita solo UI)
    onContinueEmail?: (email: string) => Promise<void> | void;
    onContinueCode?: (payload: { email: string; code: string }) => Promise<void> | void;
    onGoogle?: () => Promise<void> | void;

    defaultEmail?: string;
};

function cx(...parts: Array<string | undefined | false>) {
    return parts.filter(Boolean).join(" ");
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function useLockBodyScroll(enabled: boolean) {
    React.useEffect(() => {
        if (!enabled) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [enabled]);
}

function useEscapeToClose(enabled: boolean, onClose: () => void) {
    React.useEffect(() => {
        if (!enabled) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [enabled, onClose]);
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
            <path
                fill="#EA4335"
                d="M24 9.5c3.1 0 5.9 1.1 8.1 3.2l5.5-5.5C34.2 4.1 29.4 2 24 2 14.7 2 6.7 7.3 2.9 15l6.6 5.1C11.3 13.8 17.1 9.5 24 9.5z"
            />
            <path
                fill="#4285F4"
                d="M46 24.5c0-1.5-.1-2.6-.4-3.9H24v7.4h12.3c-.8 4-3.2 7-6.9 9.1l6.4 5c3.7-3.4 6.2-8.6 6.2-17.6z"
            />
            <path
                fill="#34A853"
                d="M9.5 28.9a14.7 14.7 0 0 1 0-9.8L2.9 14A23.9 23.9 0 0 0 2 24c0 3.9.9 7.5 2.9 10.9l6.6-6z"
            />
            <path
                fill="#FBBC05"
                d="M24 46c5.4 0 10.2-1.8 13.6-4.9l-6.4-5c-1.8 1.2-4.2 2-7.2 2-6.9 0-12.7-4.3-14.7-10.3l-6.6 6C6.7 40.7 14.7 46 24 46z"
            />
        </svg>
    );
}

function CodeBoxes({
                       value,
                       onChange,
                       disabled,
                   }: {
    value: string;
    onChange: (next: string) => void;
    disabled?: boolean;
}) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const digits = Array.from({ length: 6 }).map((_, i) => value[i] ?? "");

    const focusHidden = () => inputRef.current?.focus();

    const setFromRaw = (raw: string) => {
        const onlyDigits = raw.replace(/\D/g, "").slice(0, 6);
        onChange(onlyDigits);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === " ") e.preventDefault();
    };

    return (
        <div className="w-full">
            <button
                type="button"
                onClick={focusHidden}
                className="
          w-full
          rounded-[var(--r-lg)]
          border border-(--border)
          bg-(--surface)
          px-4 py-4
          shadow-[0_18px_40px_rgba(8,10,13,.10)]
          transition
          hover:bg-(--surface-2)
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]
        "
                aria-label="Ingresar código"
            >
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {digits.map((d, i) => (
                        <div
                            key={i}
                            className={cx(
                                "grid h-12 w-10 sm:h-12 sm:w-11 place-items-center rounded-[12px]",
                                "border border-(--border) bg-[rgba(233,226,196,.55)]",
                                "text-[18px] font-black tracking-[0.22em] text-(--text)",
                                d ? "opacity-100" : "opacity-55"
                            )}
                            aria-hidden="true"
                        >
                            {d || "•"}
                        </div>
                    ))}
                </div>
            </button>

            {/* input real (accesible) */}
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => setFromRaw(e.target.value)}
                onKeyDown={onKeyDown}
                onPaste={(e) => {
                    setFromRaw(e.clipboardData.getData("text"));
                    e.preventDefault();
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                disabled={disabled}
                className="sr-only"
                aria-label="Código de 6 dígitos"
            />

            <div className="mt-2 text-[12px] text-(--muted) text-center">
                Escribe el código de 6 dígitos que te enviamos.
            </div>
        </div>
    );
}

export default function LoginModal({
                                       open,
                                       onClose,
                                       onContinueEmail,
                                       onContinueCode,
                                       onGoogle,
                                   defaultEmail = "",
                                   }: LoginModalProps) {
    const toast = useToast();
    const [mounted, setMounted] = React.useState(false);

    const [step, setStep] = React.useState<Step>("email");
    const [email, setEmail] = React.useState(defaultEmail);
    const [code, setCode] = React.useState("");

    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!error) return;
        toast.error(error);
    }, [error, toast]);

    const emailInputRef = React.useRef<HTMLInputElement | null>(null);

    useLockBodyScroll(open);
    useEscapeToClose(open, onClose);

    React.useEffect(() => setMounted(true), []);

    React.useEffect(() => {
        if (!open) {
            setStep("email");
            setCode("");
            setError(null);
            setBusy(false);
            setEmail(defaultEmail);
        }
    }, [open, defaultEmail]);

    React.useEffect(() => {
        if (!open) return;
        window.setTimeout(() => {
            emailInputRef.current?.focus();
        }, 60);
    }, [open]);

    const canContinueEmail = isValidEmail(email) && !busy;
    const canContinueCode = code.length === 6 && !busy;

    const submitEmail = async () => {
        setError(null);
        if (!isValidEmail(email)) {
            setError("Escribe un correo válido.");
            return;
        }
        setBusy(true);
        try {
            await onContinueEmail?.(email.trim());
            setStep("code");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "No pudimos continuar. Intenta otra vez.";
            setError(msg);
        } finally {
            setBusy(false);
        }
    };

    const submitCode = async () => {
        setError(null);
        if (code.length !== 6) {
            setError("El código debe tener 6 dígitos.");
            return;
        }
        setBusy(true);
        try {
            await onContinueCode?.({ email: email.trim(), code });
            // UI-only: luego puedes cerrar al éxito
            // onClose();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Código inválido o expirado.";
            setError(msg);
        } finally {
            setBusy(false);
        }
    };

    const doGoogle = async () => {
        setError(null);
        setBusy(true);
        try {
            await onGoogle?.();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "No se pudo iniciar con Google.";
            setError(msg);
        } finally {
            setBusy(false);
        }
    };

    if (!mounted || !open) return null;

    const title = step === "email" ? "Inicia sesión" : "Verifica tu correo";
    const subtitle =
        step === "email"
            ? ""
            : "Ingresa el código de 6 dígitos para continuar.";
    const googleEnabled = Boolean(onGoogle);

    return createPortal(
        <div className="fixed inset-0 z-[80]">
            {/* Overlay */}
            <button
                type="button"
                className="absolute inset-0 bg-[rgba(8,10,13,.40)] backdrop-blur-[6px]"
                onClick={onClose}
                aria-label="Cerrar modal"
            />

            {/* Panel */}
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Modal de inicio de sesión"
                    className="
            relative w-full max-w-[520px]
            overflow-hidden
            rounded-[22px]
            border border-(--border)
            bg-[rgba(233,226,196,.92)]
            shadow-[0_30px_80px_rgba(8,10,13,.28)]
            outline-none
            animate-[sautModalIn_.22s_ease-out]
          "
                    style={{
                        backgroundImage:
                            "linear-gradient(180deg, rgba(255,255,255,.22), rgba(0,0,0,.03))",
                    }}
                >
                    {/* Decor sutil */}
                    <div
                        aria-hidden="true"
                        className="absolute -top-24 -right-24 h-56 w-56 rounded-full"
                        style={{
                            background:
                                "radial-gradient(circle at 30% 30%, rgba(255,217,66,.55), transparent 60%)",
                        }}
                    />
                    <div
                        aria-hidden="true"
                        className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full"
                        style={{
                            background:
                                "radial-gradient(circle at 70% 40%, rgba(5,122,168,.24), transparent 62%)",
                        }}
                    />

                    {/* Header */}
                    <div className="relative px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-[18px] sm:text-[20px] font-black tracking-widest uppercase text-(--text)">
                                    {title}
                                </div>
                                <div className="mt-1 text-[13px] text-(--muted) leading-relaxed">
                                    {subtitle}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="
                  grid h-10 w-10 place-items-center rounded-full
                  border border-(--border)
                  bg-(--surface)
                  text-(--text)
                  shadow-[0_12px_26px_rgba(8,10,13,.10)]
                  transition
                  hover:bg-(--surface-2)
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]
                "
                                aria-label="Cerrar"
                            >
                                <span className="text-[18px] font-black leading-none">×</span>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="relative px-5 sm:px-6 pb-6">
                        {/* Paso EMAIL */}
                        <div className={cx(step === "email" ? "block" : "hidden")}>
                            <div className="grid gap-3">
                                <label className="grid gap-1.5">
                  <span className="text-[12px] font-black tracking-[0.14em] uppercase text-(--text) opacity-80">
                    Correo
                  </span>

                                    <input
                                        ref={emailInputRef}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                void submitEmail();
                                            }
                                        }}
                                        type="email"
                                        autoComplete="email"
                                        placeholder="tu@correo.com"
                                        className="
                      h-12 w-full rounded-[14px]
                      border border-(--border)
                      bg-(--surface)
                      px-4
                      text-[14px] font-semibold text-(--text)
                      placeholder:text-(--muted)
                      shadow-[0_14px_30px_rgba(8,10,13,.08)]
                      outline-none
                      focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]
                      transition
                    "
                                    />
                                </label>

                                <button
                                    type="button"
                                    onClick={() => void submitEmail()}
                                    disabled={!canContinueEmail}
                                    className={cx(
                                        "h-12 w-full rounded-[999px]",
                                        "border border-(--border)",
                                        "bg-(--saut-yellow) text-(--saut-black)",
                                        "text-[12px] font-black tracking-[0.16em] uppercase",
                                        "shadow-[0_18px_40px_rgba(8,10,13,.16)]",
                                        "transition",
                                        "hover:bg-(--saut-blue) hover:text-white",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]",
                                        (!canContinueEmail || busy) ? "opacity-60 cursor-not-allowed" : "opacity-100"
                                    )}
                                >
                                    {busy ? "Cargando…" : "Continuar"}
                                </button>

                                {/* Divider */}
                                <div className="my-2 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-[rgba(8,10,13,.14)]" />
                                    <div className="text-[11px] font-black tracking-[0.18em] uppercase text-(--muted)">
                                        o
                                    </div>
                                    <div className="h-px flex-1 bg-[rgba(8,10,13,.14)]" />
                                </div>

                                {/* Google */}
                                <button
                                    type="button"
                                    onClick={() => void doGoogle()}
                                    disabled={!googleEnabled || busy}
                                    className={cx(
                                        "h-12 w-full rounded-[999px]",
                                        "border border-(--border)",
                                        "bg-(--surface-2) text-(--text)",
                                        "shadow-[0_18px_40px_rgba(8,10,13,.10)]",
                                        "transition",
                                        "hover:bg-(--surface)",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]",
                                        (!googleEnabled || busy) ? "opacity-70 cursor-not-allowed" : "opacity-100"
                                    )}
                                >
                  <span className="mx-auto inline-flex items-center gap-3">
                    <GoogleIcon className="h-5 w-5" />
                    <span className="text-[12px] font-black tracking-[0.14em] uppercase">
                      {googleEnabled ? "Continuar con Google" : "Google (próximamente)"}
                    </span>
                  </span>
                                </button>

                                <div className="mt-2 text-[12px] text-(--muted) leading-relaxed">
                                    Al continuar, aceptas nuestros{" "}
                                    <Link
                                        href="/terminos"
                                        className="font-bold text-(--text) underline underline-offset-4"
                                    >
                                        términos
                                    </Link>{" "}
                                    y{" "}
                                    <Link
                                        href="/privacidad"
                                        className="font-bold text-(--text) underline underline-offset-4"
                                    >
                                        privacidad
                                    </Link>
                                    .
                                </div>
                            </div>
                        </div>

                        {/* Paso CODE */}
                        <div className={cx(step === "code" ? "block" : "hidden")}>
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-[13px] text-(--muted)">
                                        Enviamos un código a{" "}
                                        <span className="font-black tracking-wide text-(--text)">
                      {email.trim() || "tu correo"}
                    </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep("email");
                                            setCode("");
                                            setError(null);
                                            window.setTimeout(() => emailInputRef.current?.focus(), 60);
                                        }}
                                        className="
                      text-[12px] font-black tracking-[0.14em] uppercase
                      text-(--text) opacity-70 hover:opacity-100 transition
                    "
                                    >
                                        Editar
                                    </button>
                                </div>

                                <CodeBoxes value={code} onChange={setCode} disabled={busy} />

                                <button
                                    type="button"
                                    onClick={() => void submitCode()}
                                    disabled={!canContinueCode}
                                    className={cx(
                                        "h-12 w-full rounded-[999px]",
                                        "border border-(--border)",
                                        "bg-(--saut-yellow) text-(--saut-black)",
                                        "text-[12px] font-black tracking-[0.16em] uppercase",
                                        "shadow-[0_18px_40px_rgba(8,10,13,.16)]",
                                        "transition",
                                        "hover:bg-(--saut-blue) hover:text-white",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]",
                                        (!canContinueCode || busy) ? "opacity-60 cursor-not-allowed" : "opacity-100"
                                    )}
                                >
                                    {busy ? "Verificando…" : "Continuar"}
                                </button>

                                <div className="flex items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setError(null)}
                                        className="
                      text-[12px] font-black tracking-[0.14em] uppercase
                      text-(--text) opacity-70 hover:opacity-100 transition
                    "
                                    >
                                        Reenviar código
                                    </button>

                                    <div className="text-[12px] text-(--muted)">
                                        ¿No llegó? Revisa spam.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error */}
                        {error ? (
                            <div
                                role="alert"
                                className="
                  mt-4 rounded-[14px]
                  border border-[rgba(219,38,75,.28)]
                  bg-[rgba(219,38,75,.10)]
                  px-4 py-3
                  text-[12px] font-semibold text-(--text)
                "
                            >
                                {error}
                            </div>
                        ) : null}
                    </div>

                    <style>{`
            @keyframes sautModalIn {
              from { opacity: 0; transform: translateY(8px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
                </div>
            </div>
        </div>,
        document.body
    );
}
