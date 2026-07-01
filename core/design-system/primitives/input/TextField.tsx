"use client";

import * as React from "react";
import { cn } from "@/core/lib/utils/cn";
import type { CssVars } from "../css-vars";

export type TextFieldSize = "sm" | "md" | "lg";
export type TextFieldState = "default" | "error" | "success";

export type TextFieldProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size"
> & {
    label?: string;
    hint?: string;
    error?: string;
    success?: string;

    size?: TextFieldSize;
    state?: TextFieldState;

    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;

    /** Password reveal toggle (solo si type="password") */
    revealable?: boolean;

    /** Layout */
    fullWidth?: boolean;
    fullWidthMobile?: boolean;

    /** Tuning sin tocar CSS global */
    ringColor?: string;       // default: amarillo suave
    borderFocusColor?: string; // default: amarillo sólido
    borderColor?: string;     // default: var(--border)
    bgColor?: string;         // default: glass blanco

    wrapperClassName?: string;
    shellClassName?: string;
    inputClassName?: string;
};

type TextFieldCssVars = CssVars<
    "--tf-bg" | "--tf-border" | "--tf-focus-border" | "--tf-ring"
>;

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                stroke="currentColor"
                strokeWidth="2"
            />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
                d="M3 3l18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M6.5 6.5C4.2 8.1 2.7 10.4 2 12c.8 1.7 2.6 4.7 6.2 6.2 2.2.9 4.6.9 6.8 0 1.3-.5 2.4-1.2 3.3-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

const sizes: Record<TextFieldSize, { shell: string; input: string }> = {
    sm: { shell: "h-[42px] px-3 rounded-[14px]", input: "text-[13px]" },
    md: { shell: "h-[48px] px-4 rounded-[14px]", input: "text-[14px]" },
    lg: { shell: "h-[56px] px-4 rounded-[16px]", input: "text-[15px]" },
};

export function TextField({
                              label,
                              hint,
                              error,
                              success,
                              size = "md",
                              state: stateProp = "default",
                              leftIcon,
                              rightIcon,
                              revealable = false,
                              fullWidth = true,
                              fullWidthMobile = false,
                              ringColor,
                              borderFocusColor,
                              borderColor,
                              bgColor,
                              wrapperClassName,
                              shellClassName,
                              inputClassName,
                              type = "text",
                              disabled,
                              id,
                              ...props
                          }: TextFieldProps) {
    const reactId = React.useId();
    const inputId = id ?? `tf-${reactId}`;
    const feedbackId = `${inputId}-feedback`;

    const autoState: TextFieldState =
        error ? "error" : success ? "success" : stateProp;

    const [show, setShow] = React.useState(false);
    const isPassword = type === "password";
    const canReveal = revealable && isPassword;
    const inputType = canReveal ? (show ? "text" : "password") : type;

    // Defaults:
    // - Focus ring: amarillo suave
    // - Focus border: amarillo más sólido
    const mergedStyle: TextFieldCssVars = {
        "--tf-bg": bgColor ?? "rgba(255,255,255,.35)",
        "--tf-border": borderColor ?? "var(--border)",
        "--tf-focus-border":
            borderFocusColor ?? "rgba(255,217,66,.95)", // ✅ amarillo primary
        "--tf-ring":
            ringColor ?? "rgba(255,217,66,.32)", // ✅ ring suave
    };

    const widthClass = fullWidth
        ? "w-full"
        : fullWidthMobile
            ? "w-full sm:w-auto"
            : "";

    // Estado: cambia border/ring cuando aplica
    const stateVars =
        autoState === "error"
            ? {
                "--tf-focus-border": "rgba(219,38,75,.95)",
                "--tf-ring": "rgba(219,38,75,.22)",
            }
            : autoState === "success"
                ? {
                    "--tf-focus-border": "rgba(5,122,168,.85)",
                    "--tf-ring": "rgba(5,122,168,.18)",
                }
                : {};

    const style: TextFieldCssVars = { ...mergedStyle, ...stateVars };

    return (
        <div className={cn(widthClass, wrapperClassName)} style={style}>
            {label ? (
                <label
                    htmlFor={inputId}
                    className="mb-2 block text-[12px] font-black tracking-[0.10em]"
                >
                    {label}
                </label>
            ) : null}

            <div
                className={cn(
                    "flex items-center gap-2",
                    // base shell
                    "bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--text)]",
                    "shadow-[0_14px_28px_rgba(8,10,13,.09)]",
                    // ✅ smooth transitions (sin brincos)
                    "transition-[box-shadow,border-color,filter] duration-200 ease-out",
                    // hover: MUY leve
                    "hover:shadow-[0_16px_30px_rgba(8,10,13,.10)]",
                    // ✅ focus: border amarillo + ring suave (sin outline/offset)
                    "focus-within:border-[var(--tf-focus-border)]",
                    "focus-within:shadow-[0_0_0_3px_var(--tf-ring),0_16px_30px_rgba(8,10,13,.10)]",
                    sizes[size].shell,
                    disabled ? "pointer-events-none opacity-60" : "",
                    shellClassName
                )}
            >
                {leftIcon ? (
                    <span className="shrink-0 text-[var(--muted)]">{leftIcon}</span>
                ) : null}

                <input
                    id={inputId}
                    type={inputType}
                    disabled={disabled}
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={hint || error || success ? feedbackId : undefined}
                    className={cn(
                        "min-w-0 flex-1 bg-transparent outline-none",
                        "placeholder:text-[var(--muted)]",
                        "font-extrabold",
                        sizes[size].input,
                        inputClassName
                    )}
                    {...props}
                />

                {canReveal ? (
                    <button
                        type="button"
                        onClick={() => setShow((v) => !v)}
                        className={cn(
                            "shrink-0 rounded-[12px] px-3 py-2",
                            "text-[12px] font-black tracking-[0.10em]",
                            "text-[var(--muted)] hover:text-[var(--text)]",
                            "hover:bg-[rgba(255,255,255,.30)]"
                        )}
                        aria-label={show ? "Ocultar" : "Mostrar"}
                    >
            <span className="inline-flex items-center gap-2">
              <EyeIcon open={show} />
                {show ? "Hide" : "Show"}
            </span>
                    </button>
                ) : rightIcon ? (
                    <span className="shrink-0 text-[var(--muted)]">{rightIcon}</span>
                ) : null}
            </div>

            {(hint || error || success) ? (
                <div id={feedbackId} className="mt-2 text-[12px] font-extrabold leading-snug">
                    {error ? (
                        <p role="alert" className="m-0 text-(--danger)">{error}</p>
                    ) : success ? (
                        <p className="m-0 text-(--success)">{success}</p>
                    ) : hint ? (
                        <p className="m-0 text-[var(--muted)]">{hint}</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
