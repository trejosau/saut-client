"use client";

import * as React from "react";
import { cn } from "@/core/lib/utils/cn";
import type { CssVars } from "../css-vars";

export type RadioTilesSize = "sm" | "md" | "lg";
export type RadioTilesState = "default" | "error" | "success";
export type RadioTilesShape = "square" | "rect";
export type RadioTilesLayout = "wrap" | "grid";
export type RadioTilesDisabledStyle = "dim" | "keep";

export type RadioTileOption = {
    value: string;
    label: string;
    sublabel?: string;
    disabled?: boolean;

    /** Para tiles visuales */
    imageSrc?: string; // /tiles/xxx.webp
    accentHex?: string; // "#rrggbb"
    icon?: React.ReactNode;
};

export type RadioTilesRenderCtx = {
    option: RadioTileOption;
    checked: boolean;
    index: number;
};

export type RadioTilesProps = {
    label?: string;
    hint?: string;
    error?: string;
    success?: string;

    name: string;
    options: RadioTileOption[];

    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;

    shape?: RadioTilesShape;
    layout?: RadioTilesLayout;
    columns?: 2 | 3 | 4 | 5 | 6;

    fullWidth?: boolean;
    fullWidthMobile?: boolean;

    size?: RadioTilesSize;
    state?: RadioTilesState;
    disabledStyle?: RadioTilesDisabledStyle;

    /** Ajustes globales (fallback) */
    ringColor?: string;
    borderFocusColor?: string;
    borderColor?: string;
    bgColor?: string;

    tileClassName?: string;
    wrapperClassName?: string;

    /** Para tiles MUY custom (prendas/diseÃ±os) */
    renderOption?: (ctx: RadioTilesRenderCtx) => React.ReactNode;
};

type RadioTilesCssVars = CssVars<
    | "--rt-bg"
    | "--rt-border"
    | "--rt-focus-border"
    | "--rt-ring"
    | "--rt-opt-accent"
    | "--rt-opt-ring"
>;

/* ---------- utils ---------- */
function gridSmCols(columns: number) {
    switch (columns) {
        case 2:
            return "sm:grid-cols-2";
        case 3:
            return "sm:grid-cols-3";
        case 4:
            return "sm:grid-cols-4";
        case 5:
            return "sm:grid-cols-5";
        case 6:
            return "sm:grid-cols-6";
        default:
            return "sm:grid-cols-4";
    }
}

function hexToRgb(hex?: string) {
    if (!hex) return null;
    const h = hex.replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    if (full.length !== 6) return null;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if ([r, g, b].some((x) => Number.isNaN(x))) return null;
    return { r, g, b };
}

function rgbaFromHex(hex?: string, a = 0.22) {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(255,217,66,${a})`; // fallback amarillo
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

/* ---------- sizing ---------- */
const squareWrapSizes: Record<RadioTilesSize, string> = {
    sm: "h-[44px] w-[44px] rounded-[14px]",
    md: "h-[56px] w-[56px] rounded-[16px]",
    lg: "h-[66px] w-[66px] rounded-[18px]",
};

const squareGridMinH: Record<RadioTilesSize, string> = {
    sm: "min-h-[110px]",
    md: "min-h-[140px]",
    lg: "min-h-[170px]",
};

const rectSizes: Record<RadioTilesSize, string> = {
    sm: "h-[44px] rounded-[14px] px-3",
    md: "h-[52px] rounded-[14px] px-4",
    lg: "h-[60px] rounded-[16px] px-4",
};

const labelSq: Record<RadioTilesSize, string> = {
    sm: "text-[12px]",
    md: "text-[13px]",
    lg: "text-[14px]",
};

const labelRect: Record<RadioTilesSize, string> = {
    sm: "text-[12px]",
    md: "text-[13px]",
    lg: "text-[14px]",
};

const subRect: Record<RadioTilesSize, string> = {
    sm: "text-[11px]",
    md: "text-[11px]",
    lg: "text-[12px]",
};

export function RadioTiles({
                               label,
                               hint,
                               error,
                               success,
                               name,
                               options,
                               value,
                               defaultValue,
                               onValueChange,

                               shape = "rect",
                               layout: layoutProp,
                               columns = 4,

                               fullWidth = true,
                               fullWidthMobile = false,

                               size = "md",
                               state: stateProp = "default",
                               disabledStyle = "dim",

                               ringColor,
                               borderFocusColor,
                               borderColor,
                               bgColor,

                               tileClassName,
                               wrapperClassName,

                               renderOption,
                           }: RadioTilesProps) {
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState(defaultValue ?? "");
    const currentValue = isControlled ? String(value) : internal;

    const autoState: RadioTilesState = error ? "error" : success ? "success" : stateProp;

    const widthClass = fullWidth ? "w-full" : fullWidthMobile ? "w-full sm:w-auto" : "";

    const layout: RadioTilesLayout = layoutProp ?? (shape === "square" ? "wrap" : "grid");

    const baseVars: RadioTilesCssVars = {
        "--rt-bg": bgColor ?? "rgba(255,255,255,.18)",
        "--rt-border": borderColor ?? "var(--color-hairline)",
        "--rt-focus-border": borderFocusColor ?? "var(--color-primary)",
        "--rt-ring": ringColor ?? "color-mix(in srgb, var(--color-primary) 22%, transparent)",
    };

    const stateVars =
        autoState === "error"
            ? {
                "--rt-focus-border": "var(--color-sale)",
                "--rt-ring": "color-mix(in srgb, var(--color-sale) 20%, transparent)",
            }
            : autoState === "success"
                ? {
                    "--rt-focus-border": "var(--color-info)",
                    "--rt-ring": "color-mix(in srgb, var(--color-info) 20%, transparent)",
                }
                : {};

    const style: RadioTilesCssVars = { ...baseVars, ...stateVars };

    const setValue = (v: string) => {
        if (!isControlled) setInternal(v);
        onValueChange?.(v);
    };

    const gridCols = cn("grid grid-cols-2 gap-3", gridSmCols(columns));
    const wrapCols = "flex flex-wrap items-center gap-2";
    const containerClass = layout === "wrap" ? wrapCols : gridCols;

    return (
        <div className={cn(widthClass, wrapperClassName)} style={style}>
            {label ? (
                <div className="mb-2 flex items-center gap-2">
                    <div className="text-[12px] font-black tracking-[0.12em] uppercase">{label}</div>
                    <span className="h-[1px] flex-1 bg-[rgba(0,0,0,.08)]" />
                </div>
            ) : null}

            <div className={containerClass}>
                {options.map((o, idx) => {
                    const id = `${name}-${idx}`;
                    const checked = o.value === currentValue;

                    const optAccent = o.accentHex ?? "var(--color-primary)";
                    const optRing = o.accentHex ? rgbaFromHex(o.accentHex, 0.22) : "color-mix(in srgb, var(--color-primary) 22%, transparent)";

                    const optVars: RadioTilesCssVars = {
                        "--rt-opt-accent": optAccent,
                        "--rt-opt-ring": optRing,
                    };

                    const square = shape === "square";

                    // square: si es grid => full width + aspect-square + min-height (tiles grandes)
                    const dim = square
                        ? layout === "grid"
                            ? cn("w-full aspect-square", squareGridMinH[size], "rounded-[20px]")
                            : squareWrapSizes[size]
                        : rectSizes[size];

                    const tileBase = cn(
                        "relative border bg-[var(--rt-bg)]",
                        "shadow-[0_18px_40px_rgba(8,10,13,.10)]",
                        "transition-[box-shadow,border-color,transform,background-color] duration-200 ease-out",
                        "hover:shadow-[0_22px_46px_rgba(8,10,13,.12)] hover:-translate-y-[1px]",
                        "border-[var(--rt-border)]",
                        // texture suave
                        "before:content-[''] before:absolute before:inset-0 before:rounded-[inherit]",
                        "before:bg-[radial-gradient(60%_70%_at_50%_18%,rgba(255,255,255,.38),rgba(255,255,255,0)_65%)]",
                        "before:opacity-70 before:pointer-events-none",
                        // focus visible
                        "peer-focus-visible:border-[var(--rt-focus-border)]",
                        "peer-focus-visible:shadow-[0_0_0_3px_var(--rt-ring),0_22px_46px_rgba(8,10,13,.12)]",
                        // selected (usa accent por opciÃ³n)
                        "peer-checked:border-[color:var(--rt-opt-accent)]",
                        "peer-checked:shadow-[0_0_0_3px_var(--rt-opt-ring),0_22px_46px_rgba(8,10,13,.12)]"
                    );

                    return (
                        <label
                            key={o.value}
                            htmlFor={id}
                            style={optVars}
                            className={cn(
                                "relative select-none",
                                o.disabled
                                    ? disabledStyle === "dim"
                                        ? "opacity-60 pointer-events-none"
                                        : "pointer-events-none"
                                    : "cursor-pointer",
                                layout === "wrap" ? "shrink-0" : "w-full"
                            )}
                        >
                            <input
                                id={id}
                                type="radio"
                                name={name}
                                value={o.value}
                                checked={isControlled ? checked : undefined}
                                defaultChecked={!isControlled ? checked : undefined}
                                onChange={() => setValue(o.value)}
                                className="peer sr-only"
                            />

                            <div
                                className={cn(
                                    tileBase,
                                    dim,
                                    square ? "overflow-hidden" : "w-full flex items-center justify-center text-center",
                                    tileClassName
                                )}
                            >
                                {renderOption ? (
                                    <div className="absolute inset-0">{renderOption({ option: o, checked, index: idx })}</div>
                                ) : (
                                    <div
                                        className={cn(
                                            "relative z-[1] w-full h-full",
                                            square ? "grid place-items-center p-2" : "flex items-center justify-center"
                                        )}
                                    >
                                        <div className="min-w-0 text-center">
                                            {o.icon ? (
                                                <div className="mb-1 grid place-items-center opacity-90">{o.icon}</div>
                                            ) : null}

                                            <div
                                                className={cn(
                                                    "font-black tracking-[0.12em] uppercase truncate",
                                                    square ? labelSq[size] : labelRect[size]
                                                )}
                                            >
                                                {o.label}
                                            </div>

                                            {!square && o.sublabel ? (
                                                <div
                                                    className={cn(
                                                        "mt-1 font-extrabold text-[rgba(8,10,13,.62)] truncate",
                                                        subRect[size]
                                                    )}
                                                >
                                                    {o.sublabel}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </label>
                    );
                })}
            </div>

            {(hint || error || success) ? (
                <div className="mt-2 text-[12px] font-extrabold leading-snug">
                    {error ? (
                        <p className="m-0 text-[rgba(219,38,75,.95)]">{error}</p>
                    ) : success ? (
                        <p className="m-0 text-[rgba(5,122,168,.95)]">{success}</p>
                    ) : hint ? (
                        <p className="m-0 text-[rgba(8,10,13,.58)]">{hint}</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
