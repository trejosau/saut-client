"use client";

import * as React from "react";
import { cn } from "@/core/lib/utils/cn";
import type { CssVars } from "../css-vars";

export type CheckboxSize = "sm" | "md" | "lg";

export type CheckboxProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "size"
> & {
    label?: string;
    hint?: string;
    error?: string;

    size?: CheckboxSize;

    /** Color del fondo cuando checked */
    accentColor?: string; // default: amarillo SAUT
    /** Color del ring focus */
    ringColor?: string; // default: amarillo suave
    /** Color del icono (palomita/guion) */
    checkColor?: string; // default: negro SAUT

    /** Indeterminate (—) */
    indeterminate?: boolean;

    wrapperClassName?: string;
};

type CheckboxCssVars = CssVars<"--cb-accent" | "--cb-ring" | "--cb-check">;

const sizes: Record<CheckboxSize, { box: string; icon: string; gap: string }> = {
    sm: { box: "h-4 w-4 rounded-[6px]", icon: "h-3.5 w-3.5", gap: "gap-2" },
    md: { box: "h-5 w-5 rounded-[8px]", icon: "h-4 w-4", gap: "gap-3" },
    lg: { box: "h-6 w-6 rounded-[10px]", icon: "h-5 w-5", gap: "gap-3" },
};

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path
                d="M6 12.5l4 4L18.5 8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function DashIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path
                d="M6.5 12h11"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function Checkbox({
                             label,
                             hint,
                             error,
                             size = "md",
                             accentColor,
                             ringColor,
                             checkColor,
                             indeterminate = false,
                             disabled,
                             id,
                             className,
                             wrapperClassName,
                             ...props
                         }: CheckboxProps) {
    const reactId = React.useId();
    const inputId = id ?? `cb-${reactId}`;
    const ref = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
        if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
    }, [indeterminate]);

    const style: CheckboxCssVars = {
        "--cb-accent": accentColor ?? "var(--saut-yellow)",
        "--cb-ring": ringColor ?? "rgba(255,217,66,.30)",
        "--cb-check": checkColor ?? "var(--saut-black)",
    };

    return (
        <div className={cn("w-full", wrapperClassName)} style={style}>
            <label
                htmlFor={inputId}
                className={cn(
                    "inline-flex items-start",
                    sizes[size].gap,
                    disabled ? "opacity-60 pointer-events-none" : "cursor-pointer"
                )}
            >
        <span className="relative mt-[2px]">
          <input
              ref={ref}
              id={inputId}
              type="checkbox"
              disabled={disabled}
              className={cn("peer sr-only", className)}
              aria-invalid={Boolean(error) || undefined}
              {...props}
          />

            {/* box */}
            <span
                className={cn(
                    "relative grid place-items-center border bg-[rgba(255,255,255,.35)]",
                    "shadow-[0_10px_18px_rgba(8,10,13,.08)]",
                    "transition-[box-shadow,border-color,background-color,filter] duration-200 ease-out",
                    "hover:shadow-[0_12px_20px_rgba(8,10,13,.09)]",
                    "peer-focus-visible:shadow-[0_0_0_3px_var(--cb-ring),0_12px_20px_rgba(8,10,13,.09)]",
                    // default border
                    "border-[var(--border)]",
                    // checked / indeterminate background
                    "peer-checked:bg-[var(--cb-accent)] peer-checked:border-[var(--cb-accent)]",
                    "peer-indeterminate:bg-[var(--cb-accent)] peer-indeterminate:border-[var(--cb-accent)]",
                    // ✅ FIX: controlar iconos desde el box (no desde los hijos)
                    "peer-checked:[&_.cb-check]:opacity-100",
                    "peer-checked:[&_.cb-dash]:opacity-0",
                    "peer-indeterminate:[&_.cb-dash]:opacity-100",
                    "peer-indeterminate:[&_.cb-check]:opacity-0",
                    // error
                    error ? "border-[rgba(219,38,75,.55)]" : "",
                    sizes[size].box
                )}
            >
            <span
                className={cn(
                    "cb-check absolute inset-0 grid place-items-center text-[var(--cb-check)] opacity-0 transition-opacity duration-150"
                )}
            >
              <CheckIcon className={sizes[size].icon} />
            </span>

            <span
                className={cn(
                    "cb-dash absolute inset-0 grid place-items-center text-[var(--cb-check)] opacity-0 transition-opacity duration-150"
                )}
            >
              <DashIcon className={sizes[size].icon} />
            </span>
          </span>
        </span>

                {/* text */}
                {(label || hint || error) ? (
                    <span className="min-w-0">
            {label ? (
                <span className="block text-[12px] font-black tracking-[0.10em]">
                {label}
              </span>
            ) : null}

                        {error ? (
                            <span className="mt-1 block text-[12px] font-extrabold text-[rgba(219,38,75,.95)]">
                {error}
              </span>
                        ) : hint ? (
                            <span className="mt-1 block text-[12px] font-extrabold text-[var(--muted)]">
                {hint}
              </span>
                        ) : null}
          </span>
                ) : null}
            </label>
        </div>
    );
}
