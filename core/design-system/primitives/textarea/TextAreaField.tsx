"use client";

import * as React from "react";
import { cn } from "@/core/lib/utils/cn";
import type { CssVars } from "../css-vars";

export type TextAreaSize = "sm" | "md" | "lg";
export type TextAreaState = "default" | "error" | "success";

export type TextAreaFieldProps = Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "size"
> & {
    label?: string;
    hint?: string;
    error?: string;
    success?: string;

    size?: TextAreaSize;
    state?: TextAreaState;

    /** Layout */
    fullWidth?: boolean;
    fullWidthMobile?: boolean;

    /** Tuning */
    ringColor?: string;        // default amarillo suave
    borderFocusColor?: string; // default amarillo sólido
    borderColor?: string;      // default var(--border)
    bgColor?: string;          // default glass blanco

    wrapperClassName?: string;
    shellClassName?: string;
    textareaClassName?: string;
};

type TextAreaCssVars = CssVars<
    "--ta-bg" | "--ta-border" | "--ta-focus-border" | "--ta-ring"
>;

const sizes: Record<TextAreaSize, { shell: string; textarea: string; minH: string }> = {
    sm: { shell: "px-3 py-3 rounded-[14px]", textarea: "text-[13px]", minH: "min-h-[92px]" },
    md: { shell: "px-4 py-3 rounded-[14px]", textarea: "text-[14px]", minH: "min-h-[110px]" },
    lg: { shell: "px-4 py-4 rounded-[16px]", textarea: "text-[15px]", minH: "min-h-[130px]" },
};

export function TextAreaField({
                                  label,
                                  hint,
                                  error,
                                  success,
                                  size = "md",
                                  state: stateProp = "default",
                                  fullWidth = true,
                                  fullWidthMobile = false,
                                  ringColor,
                                  borderFocusColor,
                                  borderColor,
                                  bgColor,
                                  wrapperClassName,
                                  shellClassName,
                                  textareaClassName,
                                  disabled,
                                  id,
                                  rows,
                                  ...props
                              }: TextAreaFieldProps) {
    const reactId = React.useId();
    const areaId = id ?? `ta-${reactId}`;
    const feedbackId = `${areaId}-feedback`;

    const autoState: TextAreaState =
        error ? "error" : success ? "success" : stateProp;

    const widthClass = fullWidth
        ? "w-full"
        : fullWidthMobile
            ? "w-full sm:w-auto"
            : "";

    const baseVars: TextAreaCssVars = {
        "--ta-bg": bgColor ?? "rgba(255,255,255,.35)",
        "--ta-border": borderColor ?? "var(--border)",
        "--ta-focus-border":
            borderFocusColor ?? "rgba(255,217,66,.95)", // amarillo primary
        "--ta-ring":
            ringColor ?? "rgba(255,217,66,.32)", // ring suave
    };

    const stateVars =
        autoState === "error"
            ? {
                "--ta-focus-border": "rgba(219,38,75,.95)",
                "--ta-ring": "rgba(219,38,75,.22)",
            }
            : autoState === "success"
                ? {
                    "--ta-focus-border": "rgba(5,122,168,.85)",
                    "--ta-ring": "rgba(5,122,168,.18)",
                }
                : {};

    const style: TextAreaCssVars = { ...baseVars, ...stateVars };

    return (
        <div className={cn(widthClass, wrapperClassName)} style={style}>
            {label ? (
                <label
                    htmlFor={areaId}
                    className="mb-2 block text-[12px] font-black tracking-[0.10em]"
                >
                    {label}
                </label>
            ) : null}

            <div
                className={cn(
                    "bg-[var(--ta-bg)] border border-[var(--ta-border)] text-[var(--text)]",
                    "shadow-[0_14px_28px_rgba(8,10,13,.09)]",
                    "transition-[box-shadow,border-color,filter] duration-200 ease-out",
                    "hover:shadow-[0_16px_30px_rgba(8,10,13,.10)]",
                    "focus-within:border-[var(--ta-focus-border)]",
                    "focus-within:shadow-[0_0_0_3px_var(--ta-ring),0_16px_30px_rgba(8,10,13,.10)]",
                    disabled ? "pointer-events-none opacity-60" : "",
                    sizes[size].shell,
                    sizes[size].minH,
                    shellClassName
                )}
            >
        <textarea
            id={areaId}
            disabled={disabled}
            rows={rows ?? 4}
            className={cn(
                "w-full bg-transparent outline-none resize-y",
                "max-h-[220px] overflow-auto", // ✅ límite + scroll
                "placeholder:text-[var(--muted)]",
                "font-extrabold leading-relaxed",
                sizes[size].textarea,
                textareaClassName
            )}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={hint || error || success ? feedbackId : undefined}
            {...props}
        />
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
