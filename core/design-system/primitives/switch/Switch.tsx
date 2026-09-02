"use client";

import * as React from "react";
import { cn } from "@/core/lib/utils/cn";
import type { CssVars } from "../css-vars";

export type SwitchSize = "sm" | "md" | "lg";

export type SwitchProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "size"
> & {
    label?: React.ReactNode;
    hint?: React.ReactNode;
    error?: React.ReactNode;

    size?: SwitchSize;

    /** Color ON */
    accentColor?: string; // default: amarillo SAUT
    /** Focus ring */
    ringColor?: string; // default: amarillo suave

    /** Layout */
    fullWidth?: boolean;
    fullWidthMobile?: boolean;

    wrapperClassName?: string;
};

type SwitchCssVars = CssVars<"--sw-accent" | "--sw-ring">;

const sizes: Record<
    SwitchSize,
    {
        track: string;
        knob: string;
        knobLeft: string;
        knobMove: string; // âœ… mueve el knob via selector en el track
        gap: string;
    }
> = {
    sm: {
        track: "h-[22px] w-[40px] rounded-full",
        knob: "h-[16px] w-[16px]",
        knobLeft: "left-[3px]",
        knobMove: "peer-checked:[&_.sw-knob]:translate-x-[18px]",
        gap: "gap-3",
    },
    md: {
        track: "h-[26px] w-[48px] rounded-full",
        knob: "h-[20px] w-[20px]",
        knobLeft: "left-[3px]",
        knobMove: "peer-checked:[&_.sw-knob]:translate-x-[22px]",
        gap: "gap-3",
    },
    lg: {
        track: "h-[30px] w-[56px] rounded-full",
        knob: "h-[24px] w-[24px]",
        knobLeft: "left-[3px]",
        knobMove: "peer-checked:[&_.sw-knob]:translate-x-[26px]",
        gap: "gap-3",
    },
};

export function Switch({
                           label,
                           hint,
                           error,
                           size = "md",
                           accentColor,
                           ringColor,
                           fullWidth = true,
                           fullWidthMobile = false,
                           disabled,
                           id,
                           className,
                           wrapperClassName,
                           ...props
                       }: SwitchProps) {
    const reactId = React.useId();
    const inputId = id ?? `sw-${reactId}`;

    const widthClass = fullWidth
        ? "w-full"
        : fullWidthMobile
            ? "w-full sm:w-auto"
            : "";

    const style: SwitchCssVars = {
        "--sw-accent": accentColor ?? "var(--color-primary)",
        "--sw-ring": ringColor ?? "color-mix(in srgb, var(--color-primary) 30%, transparent)",
    };

    return (
        <div className={cn(widthClass, wrapperClassName)} style={style}>
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
              id={inputId}
              type="checkbox"
              disabled={disabled}
              className={cn("peer sr-only", className)}
              role="switch"
              aria-invalid={Boolean(error) || undefined}
              {...props}
          />

            {/* track */}
            <span
                className={cn(
                    "relative block border bg-[rgba(255,255,255,.35)]",
                    "shadow-[0_10px_18px_rgba(8,10,13,.08)]",
                    "transition-[box-shadow,border-color,background-color,filter] duration-200 ease-out",
                    "hover:shadow-[0_12px_20px_rgba(8,10,13,.09)]",
                    "border-hairline",
                    "peer-focus-visible:shadow-[0_0_0_3px_var(--sw-ring),0_12px_20px_rgba(8,10,13,.09)]",
                    "peer-checked:bg-[var(--sw-accent)] peer-checked:border-[var(--sw-accent)]",
                    error ? "border-[rgba(219,38,75,.55)]" : "",
                    sizes[size].track,
                    // âœ… mueve el knob cuando estÃ¡ checked
                    sizes[size].knobMove
                )}
            >
            {/* knob */}
                <span
                    className={cn(
                        "sw-knob absolute top-1/2 -translate-y-1/2",
                        sizes[size].knobLeft,
                        "rounded-full bg-white",
                        "shadow-[0_8px_14px_rgba(8,10,13,.10)]",
                        // âœ… animaciÃ³n suave
                        "transform-gpu translate-x-0 will-change-transform",
                        "transition-transform duration-200 ease-out",
                        sizes[size].knob
                    )}
                />
          </span>
        </span>

                {(label !== undefined || hint !== undefined || error !== undefined) ? (
                    <span className="min-w-0">
            {label !== undefined ? (
                <span className="block text-[12px] font-black tracking-[0.10em]">
                {label}
              </span>
            ) : null}

                        {error ? (
                            <span className="mt-1 block text-[12px] font-extrabold text-[rgba(219,38,75,.95)]">
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
