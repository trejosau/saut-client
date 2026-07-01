"use client";

import type { FormErrorBag as FormErrorBagType } from "@/core/design-system/feedback/form-errors";

type FormErrorBagProps = {
  bag: FormErrorBagType | null;
  className?: string;
};

export function FormErrorBag({ bag, className }: FormErrorBagProps) {
  if (!bag || bag.summary.length === 0) return null;

  const rootClassName = ["saut-form-error-bag", className ?? ""].filter(Boolean).join(" ");

  return (
    <div className={rootClassName} role="alert" aria-live="polite">
      <p className="saut-form-error-bag__title">Revisa estos errores</p>
      <ul className="saut-form-error-bag__list">
        {bag.summary.map((message, index) => (
          <li key={`${message}-${index}`}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

