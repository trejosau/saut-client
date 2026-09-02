"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/core/lib/utils/cn";
import { FormDescription, FormError, FormLabel } from "@/core/design-system/primitives/field";
import type { CssVars } from "../css-vars";

export type TextFieldSize = "sm" | "md" | "lg";
export type TextFieldState = "default" | "error" | "success";

export type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  success?: React.ReactNode;
  size?: TextFieldSize;
  state?: TextFieldState;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  revealable?: boolean;
  fullWidth?: boolean;
  fullWidthMobile?: boolean;
  ringColor?: string;
  borderFocusColor?: string;
  borderColor?: string;
  bgColor?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  shellClassName?: string;
  inputClassName?: string;
};

type TextFieldCssVars = CssVars<"--tf-bg" | "--tf-border" | "--tf-focus-border" | "--tf-ring">;

const sizes: Record<TextFieldSize, { shell: string; input: string }> = {
  sm: { shell: "min-h-[42px] px-3 rounded-[14px]", input: "text-[13px]" },
  md: { shell: "min-h-[48px] px-4 rounded-[14px]", input: "text-[14px]" },
  lg: { shell: "min-h-[56px] px-4 rounded-[16px]", input: "text-[15px]" },
};

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
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
    labelClassName,
    shellClassName,
    inputClassName,
    type = "text",
    disabled,
    id,
    required,
    style: inputStyle,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref
) {
  const reactId = React.useId();
  const inputId = id ?? ("tf-" + reactId);
  const feedbackId = inputId + "-feedback";
  const autoState: TextFieldState = error ? "error" : success ? "success" : stateProp;
  const [show, setShow] = React.useState(false);
  const canReveal = revealable && type === "password";
  const inputType = canReveal && show ? "text" : type;
  const widthClass = fullWidth ? "w-full" : fullWidthMobile ? "w-full sm:w-auto" : "";
  const style: TextFieldCssVars = {
    ...(inputStyle as TextFieldCssVars | undefined),
    "--tf-bg": bgColor ?? "rgba(255,255,255,.35)",
    "--tf-border": borderColor ?? "var(--color-hairline)",
    "--tf-focus-border": autoState === "error" ? "var(--color-sale)" : borderFocusColor ?? "var(--color-primary)",
    "--tf-ring": autoState === "error" ? "color-mix(in srgb, var(--color-sale) 25%, transparent)" : ringColor ?? "color-mix(in srgb, var(--color-primary) 32%, transparent)",
  };
  const describedBy = [ariaDescribedBy, hint || error || success ? feedbackId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("saut-field", widthClass, wrapperClassName)} style={style}>
      {label !== undefined ? <FormLabel className={labelClassName} htmlFor={inputId} required={required}>{label}</FormLabel> : null}
      <div className={cn("saut-control", "bg-[var(--tf-bg)] border-[var(--tf-border)] focus-within:border-[var(--tf-focus-border)] focus-within:shadow-[0_0_0_3px_var(--tf-ring),var(--shadow-control)]", disabled && "saut-control--disabled", sizes[size].shell, shellClassName)}>
        {leftIcon ? <span className="shrink-0 text-mute" aria-hidden="true">{leftIcon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn("saut-control__input", "font-extrabold", sizes[size].input, inputClassName)}
          {...props}
        />
        {canReveal ? (
          <button type="button" className="saut-field-icon-button" onClick={() => setShow((current) => !current)} aria-label={show ? "Ocultar contraseÃ±a" : "Mostrar contraseÃ±a"}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        ) : rightIcon ? <span className="shrink-0 text-mute" aria-hidden="true">{rightIcon}</span> : null}
      </div>
      {(error || success || hint) ? (
        <div id={feedbackId}>
          {error ? <FormError>{error}</FormError> : success ? <p className="saut-form-description text-success">{success}</p> : <FormDescription>{hint}</FormDescription>}
        </div>
      ) : null}
    </div>
  );
});

TextField.displayName = "TextField";

export const Input = TextField;
export type InputProps = TextFieldProps;
