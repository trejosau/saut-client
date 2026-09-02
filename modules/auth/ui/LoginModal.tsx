"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Modal, TextField } from "@/core/design-system";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import { useHydrated } from "@/core/hooks/useHydrated";

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
          rounded-[var(--radius-sm)]
          border border-hairline
          bg-soft-cloud
          px-4 py-4
          shadow-[0_18px_40px_rgba(8,10,13,.10)]
          transition
          hover:bg-soft-cloud
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-info)]
        "
                aria-label="Ingresar código"
            >
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {digits.map((d, i) => (
                        <div
                            key={i}
                            className={cx(
                                "grid h-12 w-10 sm:h-12 sm:w-11 place-items-center rounded-[12px]",
                                "border border-hairline bg-[rgba(233,226,196,.55)]",
                                "text-[18px] font-black tracking-[0.22em] text-ink",
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

            <div className="mt-2 text-[12px] text-mute text-center">
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
    const mounted = useHydrated();

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

    React.useEffect(() => {
        if (!open) {
            queueMicrotask(() => {
                setStep("email");
                setCode("");
                setError(null);
                setBusy(false);
                setEmail(defaultEmail);
            });
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

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            description={subtitle || undefined}
            size="sm"
            className="border-hairline bg-[rgba(233,226,196,.92)] shadow-[0_30px_80px_rgba(8,10,13,.28)] animate-[sautModalIn_.22s_ease-out]"
            contentClassName="relative px-5 pb-6 sm:px-6"
        >
                    {/* Decor sutil */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full"
                        style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,217,66,.55), transparent 60%)" }}
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full"
                        style={{ background: "radial-gradient(circle at 70% 40%, rgba(5,122,168,.24), transparent 62%)" }}
                    />

                    <div className="relative">
                        {/* Paso EMAIL */}
                        <div className={cx(step === "email" ? "block" : "hidden")}>
                            <div className="grid gap-3">
                                <TextField
                                    ref={emailInputRef}
                                    label="Correo"
                                    labelClassName="text-[12px] font-black tracking-[0.14em] uppercase text-ink opacity-80"
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
                                    size="md"
                                    bgColor="var(--color-soft-cloud)"
                                    shellClassName="shadow-[0_14px_30px_rgba(8,10,13,.08)]"
                                    inputClassName="font-semibold"
                                />

                                <Button
                                    type="button"
                                    onClick={() => void submitEmail()}
                                    disabled={!canContinueEmail}
                                    isLoading={busy}
                                    size="md"
                                    fullWidth
                                    caps={false}
                                    className="rounded-[999px] border border-hairline text-[12px] font-black tracking-[0.16em] uppercase shadow-[0_18px_40px_rgba(8,10,13,.16)] hover:bg-info hover:text-white"
                                >
                                    {busy ? "Cargando…" : "Continuar"}
                                </Button>

                                {/* Divider */}
                                <div className="my-2 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-[rgba(8,10,13,.14)]" />
                                    <div className="text-[11px] font-black tracking-[0.18em] uppercase text-mute">
                                        o
                                    </div>
                                    <div className="h-px flex-1 bg-[rgba(8,10,13,.14)]" />
                                </div>

                                {/* Google */}
                                <Button
                                    type="button"
                                    onClick={() => void doGoogle()}
                                    disabled={!googleEnabled || busy}
                                    size="md"
                                    fullWidth
                                    caps={false}
                                    variant="secondary"
                                    className="rounded-[999px] text-[12px] font-black tracking-[0.14em] uppercase shadow-[0_18px_40px_rgba(8,10,13,.10)]"
                                >
                  <span className="mx-auto inline-flex items-center gap-3">
                    <GoogleIcon className="h-5 w-5" />
                    <span className="text-[12px] font-black tracking-[0.14em] uppercase">
                      {googleEnabled ? "Continuar con Google" : "Google (próximamente)"}
                    </span>
                  </span>
                                </Button>

                                <div className="mt-2 text-[12px] text-mute leading-relaxed">
                                    Al continuar, aceptas nuestros{" "}
                                    <Link
                                        href="/terminos"
                                        className="font-bold text-ink underline underline-offset-4"
                                    >
                                        términos
                                    </Link>{" "}
                                    y{" "}
                                    <Link
                                        href="/privacidad"
                                        className="font-bold text-ink underline underline-offset-4"
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
                                    <div className="text-[13px] text-mute">
                                        Enviamos un código a{" "}
                                        <span className="font-black tracking-wide text-ink">
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
                      text-ink opacity-70 hover:opacity-100 transition
                    "
                                    >
                                        Editar
                                    </button>
                                </div>

                                <CodeBoxes value={code} onChange={setCode} disabled={busy} />

                                <Button
                                    type="button"
                                    onClick={() => void submitCode()}
                                    disabled={!canContinueCode}
                                    isLoading={busy}
                                    size="md"
                                    fullWidth
                                    caps={false}
                                    className="rounded-[999px] border border-hairline text-[12px] font-black tracking-[0.16em] uppercase shadow-[0_18px_40px_rgba(8,10,13,.16)] hover:bg-info hover:text-white"
                                >
                                    {busy ? "Verificando…" : "Continuar"}
                                </Button>

                                <div className="flex items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setError(null)}
                                        className="
                      text-[12px] font-black tracking-[0.14em] uppercase
                      text-ink opacity-70 hover:opacity-100 transition
                    "
                                    >
                                        Reenviar código
                                    </button>

                                    <div className="text-[12px] text-mute">
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
                  text-[12px] font-semibold text-ink
                "
                            >
                                {error}
                            </div>
                        ) : null}
                    </div>

            <style>{`@keyframes sautModalIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
        </Modal>
    );
}
