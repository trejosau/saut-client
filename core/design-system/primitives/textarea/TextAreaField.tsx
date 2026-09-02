"use client";

import * as React from "react";

import { cn } from "@/core/lib/utils/cn";
import { FormDescription, FormError, FormLabel } from "@/core/design-system/primitives/field";
import type { CssVars } from "../css-vars";

export type TextAreaSize = "sm" | "md" | "lg";
export type TextAreaState = "default" | "error" | "success";

export type TextAreaFieldProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  success?: React.ReactNode;
  size?: TextAreaSize;
  state?: TextAreaState;
  fullWidth?: boolean;
  fullWidthMobile?: boolean;
  ringColor?: string;
  borderFocusColor?: string;
  borderColor?: string;
  bgColor?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  shellClassName?: string;
  textareaClassName?: string;
};

type TextAreaCssVars = CssVars<"--ta-bg" | "--ta-border" | "--ta-focus-border" | "--ta-ring">;
const sizes: Record<TextAreaSize, { shell: string; area: string }> = {
  sm: { shell: "px-3 py-3 rounded-[14px]", area: "text-[13px] min-h-[92px]" },
  md: { shell: "px-4 py-3 rounded-[14px]", area: "text-[14px] min-h-[110px]" },
  lg: { shell: "px-4 py-4 rounded-[16px]", area: "text-[15px] min-h-[130px]" },
};

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  {
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
    labelClassName,
    shellClassName,
    textareaClassName,
    disabled,
    id,
    required,
    rows = 4,
    style: areaStyle,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref
) {
  const reactId = React.useId();
  const areaId = id ?? ("ta-" + reactId);
  const feedbackId = areaId + "-feedback";
  const state = error ? "error" : success ? "success" : stateProp;
  const style: TextAreaCssVars = {
    ...(areaStyle as TextAreaCssVars | undefined),
    "--ta-bg": bgColor ?? "rgba(255,255,255,.35)",
    "--ta-border": borderColor ?? "var(--color-hairline)",
    "--ta-focus-border": state === "error" ? "rgba(219,38,75,.95)" : borderFocusColor ?? "rgba(255,217,66,.95)",
    "--ta-ring": state === "error" ? "rgba(219,38,75,.22)" : ringColor ?? "rgba(255,217,66,.32)",
  };
  const describedBy = [ariaDescribedBy, hint || error || success ? feedbackId : undefined].filter(Boolean).join(" ") || undefined;
  const widthClass = fullWidth ? "w-full" : fullWidthMobile ? "w-full sm:w-auto" : "";
  return (
    <div className={cn("saut-field", widthClass, wrapperClassName)} style={style}>
      {label !== undefined ? <FormLabel className={labelClassName} htmlFor={areaId} required={required}>{label}</FormLabel> : null}
      <div className={cn("saut-control items-start", "bg-[var(--ta-bg)] border-[var(--ta-border)] focus-within:border-[var(--ta-focus-border)] focus-within:shadow-[0_0_0_3px_var(--ta-ring),var(--shadow-control)]", disabled && "saut-control--disabled", sizes[size].shell, shellClassName)}>
        <textarea ref={ref} id={areaId} disabled={disabled} required={required} rows={rows} aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy} className={cn("saut-control__input resize-y leading-relaxed", sizes[size].area, textareaClassName)} {...props} />
      </div>
      {(error || success || hint) ? (
        <div id={feedbackId}>
          {error ? <FormError>{error}</FormError> : success ? <p className="saut-form-description text-success">{success}</p> : <FormDescription>{hint}</FormDescription>}
        </div>
      ) : null}
    </div>
  );
});

TextAreaField.displayName = "TextAreaField";
export const Textarea = TextAreaField;
export type TextareaProps = TextAreaFieldProps;
