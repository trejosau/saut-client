import * as React from "react";

import { cn } from "@/core/lib/utils/cn";

/** Shared field building blocks used by every form primitive. */
export type FormFieldProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
};

export function FormField({
  label,
  description,
  error,
  required,
  htmlFor,
  className,
  children,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId();
  const fieldId = htmlFor ?? `field-${generatedId}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  return (
    <div className={cn("saut-field", className)} {...props}>
      {label !== undefined ? (
        <FormLabel htmlFor={fieldId} required={required}>
          {label}
        </FormLabel>
      ) : null}
      {children}
      {description !== undefined && !error ? (
        <FormDescription id={descriptionId}>{description}</FormDescription>
      ) : null}
      {error ? <FormError id={errorId}>{error}</FormError> : null}
    </div>
  );
}
export type FormLabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function FormLabel({ required, className, children, ...props }: FormLabelProps) {
  return (
    <label className={cn("saut-form-label", className)} {...props}>
      {children}
      {required ? (
        <span className="saut-required" aria-hidden="true">*</span>
      ) : null}
    </label>
  );
}

export function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("saut-form-description", className)} {...props} />;
}

export function FormError({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("saut-form-error", className)} role="alert" {...props} />;
}

export type FormActionsProps = React.HTMLAttributes<HTMLDivElement>;

export function FormActions({ className, ...props }: FormActionsProps) {
  return <div className={cn("saut-form-actions", className)} {...props} />;
}
