"use client";

import type { FormErrorBag as FormErrorBagType } from "@/core/design-system/feedback/form-errors";
import { Alert } from "./Alert";

type FormErrorBagProps = {
  bag: FormErrorBagType | null;
  className?: string;
};

export function FormErrorBag({ bag, className }: FormErrorBagProps) {
  if (!bag || bag.summary.length === 0) return null;

  return (
    <Alert tone="error" title="Revisa estos errores" className={className} aria-live="polite">
      <ul className="saut-form-error-bag__list">
        {bag.summary.map((message, index) => (
          <li key={`${message}-${index}`}>{message}</li>
        ))}
      </ul>
    </Alert>
  );
}

