import * as React from "react";

import { cn } from "@/core/lib/utils/cn";

export type SpinnerSize = "xs" | "sm" | "md" | "lg";

export type SpinnerProps = React.HTMLAttributes<HTMLSpanElement> & {
  size?: SpinnerSize;
  label?: string;
};

const sizes: Record<SpinnerSize, string> = {
  xs: "h-3 w-3 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function Spinner({ size = "md", label = "Cargando", className, ...props }: SpinnerProps) {
  return (
    <span
      className={cn("saut-spinner inline-block rounded-full border-current border-t-transparent animate-spin", sizes[size], className)}
      role="status"
      aria-label={label}
      {...props}
    />
  );
}
