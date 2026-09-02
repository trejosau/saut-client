"use client";

import * as React from "react";
import { cn } from "@/core/lib/utils/cn";
import type { CssVars } from "../css-vars";

export type CheckboxSize = "sm" | "md" | "lg";

export type CheckboxProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size"
> & {
    label?: React.ReactNode;
    hint?: React.ReactNode;
    error?: React.ReactNode;

    size?: CheckboxSize;

    /** ✅ Soporte indeterminate */
    indeterminate?: boolean;

    /** Custom colors (opcionales) */
    accentColor?: string; // fill cuando checked/indeterminate
    ringColor?: string;   // focus-visible ring
    checkColor?: string;  // icono check / dash

    wrapperClassName?: string;
};

type CheckboxCssVars = CssVars<"--cb-accent" | "--cb-ring" | "--cb-check">;

const sizes: Record<
    CheckboxSize,
    { box: string; icon: string; gap: string }
> = {
    sm: { box: "h-[18px] w-[18px] rounded-[6px]", icon: "h-3 w-3", gap: "gap-2" },
    md: { box: "h-[22px] w-[22px] rounded-[7px]", icon: "h-3.5 w-3.5", gap: "gap-2.5" },
    lg: { box: "h-[26px] w-[26px] rounded-[8px]", icon: "h-4 w-4", gap: "gap-3" },
};

export const CheckboxControl = React.forwardRef<
    HTMLInputElement,
    Omit<CheckboxProps, "label" | "hint" | "error" | "wrapperClassName">
>(function CheckboxControl(
    {
        size = "md",
        accentColor,
        ringColor,
        checkColor,
        indeterminate = false,
        disabled,
        className,
        ...props
    },
    forwardedRef
) {
    const localRef = React.useRef<HTMLInputElement | null>(null);

    const setRef = React.useCallback((node: HTMLInputElement | null) => {
        localRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
    }, [forwardedRef]);

    React.useEffect(() => {
        if (localRef.current) localRef.current.indeterminate = Boolean(indeterminate);
    }, [indeterminate]);

    const style: CheckboxCssVars = {
        "--cb-accent": accentColor ?? "var(--color-primary)",
        "--cb-ring": ringColor ?? "rgba(255,217,66,.30)",
        "--cb-check": checkColor ?? "var(--color-ink)",
    };

    return (
        <span className="relative inline-flex shrink-0" style={style}>
            <input {...props} ref={setRef} type="checkbox" disabled={disabled} className={cn("peer sr-only", className)} />
            <span
                aria-hidden="true"
                className={cn(
                    "relative grid place-items-center border bg-[rgba(255,255,255,.35)]",
                    "shadow-[0_10px_18px_rgba(8,10,13,.08)] transition-[box-shadow,border-color,background-color] duration-200",
                    "peer-focus-visible:shadow-[0_0_0_3px_var(--cb-ring),0_12px_20px_rgba(8,10,13,.09)]",
                    "border-hairline peer-checked:bg-[var(--cb-accent)] peer-checked:border-[var(--cb-accent)]",
                    "peer-indeterminate:bg-[var(--cb-accent)] peer-indeterminate:border-[var(--cb-accent)]",
                    "peer-checked:[&_.cb-check]:opacity-100 peer-indeterminate:[&_.cb-dash]:opacity-100",
                    "peer-indeterminate:[&_.cb-check]:opacity-0",
                    disabled && "opacity-60",
                    sizes[size].box,
                )}
            >
                <span className="cb-check absolute inset-0 grid place-items-center text-[var(--cb-check)] opacity-0 transition-opacity duration-150"><CheckIcon className={sizes[size].icon} /></span>
                <span className="cb-dash absolute inset-0 grid place-items-center text-[var(--cb-check)] opacity-0 transition-opacity duration-150"><DashIcon className={sizes[size].icon} /></span>
            </span>
        </span>
    );
});

CheckboxControl.displayName = "CheckboxControl";

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
    return (
        <div className={cn("w-full", wrapperClassName)}>
            <label
                htmlFor={inputId}
                className={cn(
                    "inline-flex items-start",
                    sizes[size].gap,
                    disabled ? "opacity-60 pointer-events-none" : "cursor-pointer"
                )}
            >
                <CheckboxControl id={inputId} disabled={disabled} className={className} aria-invalid={Boolean(error) || undefined} indeterminate={indeterminate} size={size} accentColor={accentColor} ringColor={ringColor} checkColor={checkColor} {...props} />

                {/* text */}
                {(label !== undefined || hint !== undefined || error !== undefined) ? (
                    <span className="min-w-0">
                        {label !== undefined ? (
                            <span className="block text-[12px] font-black tracking-[0.10em] text-ink">
                                {label}
                            </span>
                        ) : null}

                        {error ? (
                            <span className="mt-1 block text-[12px] font-extrabold text-sale">
                                {error}
                            </span>
                        ) : hint ? (
                            <span className="mt-1 block text-[12px] font-extrabold text-mute">
                                {hint}
                            </span>
                        ) : null}
                    </span>
                ) : null}
            </label>
        </div>
    );
}