"use client";

import * as React from "react";

import { cn } from "@/core/lib/utils/cn";
import { FormDescription, FormError } from "@/core/design-system/primitives/field";

export type RadioSize = "sm" | "md" | "lg";

export type RadioProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  success?: React.ReactNode;
  size?: RadioSize;
  wrapperClassName?: string;
  labelClassName?: string;
};

const sizes: Record<RadioSize, { control: string; dot: string; gap: string }> = {
  sm: { control: "h-4 w-4", dot: "h-1.5 w-1.5", gap: "gap-2" },
  md: { control: "h-5 w-5", dot: "h-2 w-2", gap: "gap-2.5" },
  lg: { control: "h-6 w-6", dot: "h-2.5 w-2.5", gap: "gap-3" },
};

export type RadioControlProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> & { size?: RadioSize };

export const RadioControl = React.forwardRef<HTMLInputElement, RadioControlProps>(function RadioControl(
  { size = "md", className, id, disabled, ...props },
  ref,
) {
  return (
    <span className="relative mt-0.5 inline-flex shrink-0">
      <input {...props} ref={ref} id={id} type="radio" disabled={disabled} className={cn("peer sr-only", className)} />
      <span
        aria-hidden="true"
        className={cn(
          "grid place-items-center rounded-full border border-hairline bg-soft-cloud",
          "transition-[border-color,box-shadow,background-color] duration-150",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-info",
          "peer-checked:border-info peer-checked:bg-info",
          "peer-checked:[&>span]:opacity-100",
          disabled && "opacity-60",
          sizes[size].control,
        )}
      >
        <span className={cn("rounded-full bg-white opacity-0 transition-opacity", sizes[size].dot)} />
      </span>
    </span>
  );
});

RadioControl.displayName = "RadioControl";

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    label,
    hint,
    error,
    success,
    size = "md",
    wrapperClassName,
    labelClassName,
    className,
    id,
    disabled,
    required,
    ...props
  },
  ref,
) {
  const reactId = React.useId();
  const inputId = id ?? `radio-${reactId}`;
  const feedbackId = `${inputId}-feedback`;
  const describedBy = props["aria-describedby"] ?? (hint || error || success ? feedbackId : undefined);

  return (
    <div className={cn("saut-field", wrapperClassName)}>
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-start",
          sizes[size].gap,
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
      >
        <RadioControl
          {...props}
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-describedby={describedBy}
          size={size}
          className={className}
        />
        {label !== undefined ? (
          <span className={cn("min-w-0 text-[12px] font-black tracking-[0.08em]", labelClassName)}>
            {label}
          </span>
        ) : null}
      </label>
      {(hint || error || success) ? (
        <div id={feedbackId} className="ml-7">
          {error ? <FormError>{error}</FormError> : success ? <p className="saut-form-description text-(--success)">{success}</p> : <FormDescription>{hint}</FormDescription>}
        </div>
      ) : null}
    </div>
  );
});

Radio.displayName = "Radio";
