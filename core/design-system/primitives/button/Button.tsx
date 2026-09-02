"use client";

import * as React from "react";
import { cn } from "@/core/lib/utils/cn";
import type { CssVars } from "../css-vars";

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "blue"
    | "navy"
    | "danger"
    | "wine"
    | "ghost"
    | "outline"
    | "link";

export type ButtonSize = "fit" | "sm" | "md" | "lg" | "xl" | "icon" | "pill";
export type ButtonShadow = "soft" | "none";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    shadow?: ButtonShadow;

    /** Texto en mayúsculas + tracking streetwear (default true). */
    caps?: boolean;

    /** Cambia color del “hilo” (default negro suave). */
    shadowColor?: string;

    /** Cambia color del focus ring. */
    ringColor?: string;

    /** ✅ Loading */
    isLoading?: boolean;

    /** ✅ Icon + label */
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;

    /** ✅ Link button: <Button asChild><Link ...>Example</Link></Button> */
    asChild?: boolean;

    /** ✅ Full width */
    fullWidth?: boolean;        // siempre w-full
    fullWidthMobile?: boolean;  // w-full solo en mobile, sm:w-auto
};

type ButtonCssVars = CssVars<"--btn-shadow" | "--btn-ring">;

type ButtonChildProps = {
    className?: string;
    style?: React.CSSProperties;
    tabIndex?: number;
    children?: React.ReactNode;
    "aria-busy"?: boolean;
    "aria-disabled"?: boolean;
};

const base =
    "relative inline-flex items-center justify-center gap-2 select-none whitespace-nowrap cursor-pointer " +
    "font-black border-0 outline-none " +
    "transition-[box-shadow,filter,background-color] duration-150 ease-out " +
    "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--btn-ring)] " +
    "disabled:pointer-events-none disabled:opacity-60 " +
    "[--btn-shadow:rgba(0,0,0,.28)] [--btn-ring:var(--color-info)]";

const capsOn = "uppercase tracking-[0.12em]";
const capsOff = "normal-case tracking-normal";

const sizes: Record<ButtonSize, string> = {
    fit: "py-[10px] px-[18px] text-[13px] rounded-[10px]",
    sm: "h-[40px] px-[14px] text-[12px] rounded-[10px]",
    md: "h-[48px] px-[18px] text-[14px] rounded-[10px]",
    lg: "h-[56px] px-[26px] text-[16px] rounded-[12px]",
    xl: "h-[72px] px-[36px] text-[22px] rounded-[12px]",
    icon: "h-[44px] w-[44px] p-0 text-[18px] rounded-[12px]",
    pill: "h-[40px] px-[16px] text-[13px] rounded-full",
};

const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary text-ink hover:bg-primary/90",
    secondary: "bg-soft-cloud text-ink border border-hairline hover:bg-soft-cloud/80",
    blue: "bg-info text-soft-cloud hover:bg-info/90",
    navy: "bg-charcoal text-soft-cloud hover:bg-charcoal/90",
    danger: "bg-sale text-soft-cloud hover:bg-sale/90",
    wine: "bg-sale-deep text-soft-cloud hover:bg-sale-deep/90",

    ghost:
        "bg-transparent text-ink " +
        "hover:bg-soft-cloud/60 active:bg-soft-cloud/40",

    outline:
        "bg-transparent text-ink border-2 border-hairline " +
        "hover:bg-soft-cloud/50 active:bg-soft-cloud/30",

    link: "bg-transparent text-info shadow-none underline underline-offset-4 hover:brightness-90",
};

/**
 * ✅ 2 “hilos” suaves abajo+derecha (negro y fino)
 * Hover: solo cambia shadow (SIN mover)
 * Active: casi imperceptible (baja un poquito)
 * (SIN inset, SIN translate, SIN scale)
 */
const softShadowBySize: Record<ButtonSize, string> = {
    fit:
        "shadow-[2px_2px_0_var(--btn-shadow),6px_10px_18px_rgba(0,0,0,.10)] " +
        "hover:shadow-[3px_3px_0_var(--btn-shadow),7px_12px_20px_rgba(0,0,0,.11)] " +
        "active:shadow-[1px_1px_0_rgba(0,0,0,.24),5px_8px_14px_rgba(0,0,0,.08)] active:brightness-[0.99]",
    sm:
        "shadow-[2px_2px_0_var(--btn-shadow),6px_10px_18px_rgba(0,0,0,.10)] " +
        "hover:shadow-[3px_3px_0_var(--btn-shadow),7px_12px_20px_rgba(0,0,0,.11)] " +
        "active:shadow-[1px_1px_0_rgba(0,0,0,.24),5px_8px_14px_rgba(0,0,0,.08)] active:brightness-[0.99]",
    md:
        "shadow-[3px_3px_0_var(--btn-shadow),7px_12px_20px_rgba(0,0,0,.10)] " +
        "hover:shadow-[4px_4px_0_var(--btn-shadow),8px_14px_22px_rgba(0,0,0,.11)] " +
        "active:shadow-[2px_2px_0_rgba(0,0,0,.24),6px_10px_16px_rgba(0,0,0,.08)] active:brightness-[0.99]",
    lg:
        "shadow-[4px_4px_0_var(--btn-shadow),8px_14px_22px_rgba(0,0,0,.10)] " +
        "hover:shadow-[5px_5px_0_var(--btn-shadow),9px_16px_24px_rgba(0,0,0,.11)] " +
        "active:shadow-[3px_3px_0_rgba(0,0,0,.24),7px_12px_18px_rgba(0,0,0,.08)] active:brightness-[0.99]",
    xl:
        "shadow-[5px_5px_0_var(--btn-shadow),10px_18px_28px_rgba(0,0,0,.10)] " +
        "hover:shadow-[6px_6px_0_var(--btn-shadow),11px_20px_30px_rgba(0,0,0,.11)] " +
        "active:shadow-[4px_4px_0_rgba(0,0,0,.24),9px_16px_24px_rgba(0,0,0,.08)] active:brightness-[0.99]",
    icon:
        "shadow-[3px_3px_0_var(--btn-shadow),7px_12px_20px_rgba(0,0,0,.10)] " +
        "hover:shadow-[4px_4px_0_var(--btn-shadow),8px_14px_22px_rgba(0,0,0,.11)] " +
        "active:shadow-[2px_2px_0_rgba(0,0,0,.24),6px_10px_16px_rgba(0,0,0,.08)] active:brightness-[0.99]",
    pill:
        "shadow-[2px_2px_0_var(--btn-shadow),6px_10px_18px_rgba(0,0,0,.10)] " +
        "hover:shadow-[3px_3px_0_var(--btn-shadow),7px_12px_20px_rgba(0,0,0,.11)] " +
        "active:shadow-[1px_1px_0_rgba(0,0,0,.24),5px_8px_14px_rgba(0,0,0,.08)] active:brightness-[0.99]",
};

/** ✅ Sin shadow pero con feedback leve (sin mover) */
const noShadowMotion =
    "shadow-none " +
    "hover:shadow-[0_10px_18px_rgba(0,0,0,.08)] " +
    "active:shadow-[0_8px_14px_rgba(0,0,0,.06)] active:brightness-[0.99]";

function Spinner({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                "inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin",
                className
            )}
        />
    );
}

function mergeClassName(a?: string, b?: string) {
    if (!a) return b ?? "";
    if (!b) return a;
    return `${a} ${b}`;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = "primary",
            size = "md",
            shadow = "soft",
            caps = true,
            shadowColor,
            ringColor,
            style,
            type = "button",
            isLoading = false,
            leftIcon,
            rightIcon,
            asChild = false,
            fullWidth = false,
            fullWidthMobile = false,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const mergedStyle: ButtonCssVars = {
            ...style,
            ...(shadowColor ? { "--btn-shadow": shadowColor } : {}),
            ...(ringColor ? { "--btn-ring": ringColor } : {}),
        };

        const widthClass = fullWidth
            ? "w-full"
            : fullWidthMobile
                ? "w-full sm:w-auto"
                : "";

        const classes = cn(
            base,
            caps ? capsOn : capsOff,
            sizes[size],
            variants[variant],
            shadow === "soft" ? softShadowBySize[size] : noShadowMotion,
            widthClass,
            className
        );

        const content = (
            <>
                {isLoading ? <Spinner /> : leftIcon ? <span aria-hidden="true">{leftIcon}</span> : null}
                <span>{children}</span>
                {rightIcon ? <span aria-hidden="true">{rightIcon}</span> : null}
            </>
        );

        // ✅ Link button (asChild): clona el hijo y le aplica clases + contenido
        if (asChild) {
            if (!React.isValidElement(children)) {
                // si alguien lo usa mal, no tronamos: regresamos un button normal
                return (
                    <button
                        ref={ref}
                        type={type}
                        style={mergedStyle}
                        aria-busy={isLoading || undefined}
                        disabled={disabled || isLoading}
                        className={classes}
                        {...props}
                    >
                        {content}
                    </button>
                );
            }

            const child = children as React.ReactElement<ButtonChildProps>;
            const childClassName = mergeClassName(child.props.className, classes);

            return React.cloneElement(child, {
                className: childClassName,
                style: mergedStyle,
                "aria-busy": isLoading || undefined,
                "aria-disabled": disabled || isLoading || undefined,
                tabIndex: disabled || isLoading ? -1 : child.props.tabIndex,
                children: (
                    <>
                        {isLoading ? <Spinner /> : leftIcon ? <span aria-hidden="true">{leftIcon}</span> : null}
                        <span>{child.props.children}</span>
                        {rightIcon ? <span aria-hidden="true">{rightIcon}</span> : null}
                    </>
                ),
            });
        }

        return (
            <button
                ref={ref}
                type={type}
                style={mergedStyle}
                aria-busy={isLoading || undefined}
                disabled={disabled || isLoading}
                className={classes}
                {...props}
            >
                {content}
            </button>
        );
    }
);

Button.displayName = "Button";